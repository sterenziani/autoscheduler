import { IScheduleInputData } from '../interfaces/schedule.interface';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import ScheduleDao from '../persistence/abstract/schedule.dao';
import ScheduleDaoFactory from '../factories/scheduleDao.factory';
import StudentService from './student.service';
import ProgramService from './program.service';
import TermService from './term.service';
import CourseClass from '../models/abstract/courseClass.model';
import {ISchedule, IScheduleWithScore} from '../interfaces/schedule.interface';
import Time from '../helpers/classes/time.class';
import TimeRange from '../helpers/classes/timeRange.class';
import { DEFAULT_DISTANCE } from '../constants/schedule.constants';

const MINUTE_IN_MS = 60000;
const TARGET_HOUR_EXCEED_RATE_LIMIT = 1.25;

export default class ScheduleService {
    private static instance: ScheduleService;
    private dao: ScheduleDao;

    private studentService!: StudentService;
    private programService!: ProgramService;
    private termService!: TermService;

    static getInstance(): ScheduleService {
        if (!ScheduleService.instance) {
            ScheduleService.instance = new ScheduleService();
        }
        return ScheduleService.instance;
    }

    constructor() {
        this.dao = ScheduleDaoFactory.get();
    }

    init() {
        this.studentService = StudentService.getInstance();
        this.termService = TermService.getInstance();
        this.programService = ProgramService.getInstance();
    }

    async getSchedules(
        studentId: string,
        universityId: string,
        programId: string,
        termId: string,
        targetHours: number,
        reduceDays: boolean,
        prioritizeUnlocks: boolean,
        unavailableTimeSlots: TimeRange[]
    ): Promise<IScheduleWithScore[]> {
        // TODO: Calculate maxOptionalCourseCredits properly
        const maxOptionalCourseCredits = 12;

        // STEPS 1-4 - Get all information needed
        const inputData: IScheduleInputData = await this.dao.getScheduleInfo(universityId, programId, termId, studentId);

        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots (done inside getCourseClassCombinations)
        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        const deadline = new Date(Date.now() + MINUTE_IN_MS)
        const courseClassCombinations = this.getCourseClassCombinations(inputData, unavailableTimeSlots, targetHours, maxOptionalCourseCredits, deadline);

        // STEP 8 - Calculate stats for every valid schedule
        // STEP 9 - Calculate score for each schedule
        const schedules = [];
        for(const combo of courseClassCombinations){
            const schedule = this.createSchedule(combo, inputData);
            const score = this.calculateScheduleScore(schedule, targetHours, reduceDays, prioritizeUnlocks);
            schedules.push({schedule: schedule, score: score});
        }

        // STEP 10 - Return sorted list of schedules by score
        return schedules.sort((a, b) =>  b.score-a.score).slice(0, 10);
    }

    private areTimeRangesCompatible(timeRangeA: TimeRange[], timeRangeB: TimeRange[]): boolean {
        for (const tA of timeRangeA) {
            for (const tB of timeRangeB) {
                if(tA.overlaps(tB)) return false;
            }
        }
        return true;
    }

    private getViableCourseClassesMap(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[]): Map<string, string[]> {
        const viableCourseClassesMap: Map<string, string[]> = new Map<string, string[]>();
        for(const courseId of inputData.courses.keys()) {
            viableCourseClassesMap.set(courseId, []);
            const ccIds = inputData.courseClassesOfCourse.get(courseId) ?? [];
            for(const ccId of ccIds) {
                const ccLectureIds = inputData.lecturesOfCourseClass.get(ccId) ?? [];
                const ccLectureTimes: TimeRange[] = [];
                for(const lectureId of ccLectureIds){
                    const l = inputData.lectures.get(lectureId);
                    if(l !== undefined) ccLectureTimes.push(l.time);
                }
                if(this.areTimeRangesCompatible(ccLectureTimes, unavailableTimeSlots))
                    viableCourseClassesMap.get(courseId)?.push(ccId);
            }
        }
        return viableCourseClassesMap;
    }

    // Returns matrix where each array contains classes belonging to a course, example:
    // resp = [ [A1, A2], [B1, B2], [C1] ]
    // Returned groups of classes will be sorted by their course's correlatives in increasing order
    private getSortedViableCourseClassesArray(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[]): CourseClass[][] {
        const viableCourseClassesMap: Map<string, string[]> = this.getViableCourseClassesMap(inputData, unavailableTimeSlots);
        const viableCourseIds: string[] = Array.from(viableCourseClassesMap.keys());

        // Sort course IDs by their importance (in case of a draw, mandatory courses take proirity)
        const mandatoryIds = inputData.mandatoryCourseIds;
        const importance = inputData.indirectCorrelativesAmount;
        viableCourseIds.sort((c1,c2) => {
            const importance1 = importance.get(c1);
            const importance2 = importance.get(c2);
            if(importance1 == importance2) {
                if(mandatoryIds.includes(c1) && !mandatoryIds.includes(c2)) return 1;
                if(!mandatoryIds.includes(c1) && mandatoryIds.includes(c2)) return -1;
                return 0;
            }
            if(importance1 === undefined || importance2 === undefined)
                throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            return importance1-importance2;
        });

        // Most important (or mandatory) courses go at the end of the array to ensure they're processed first in case of timeout
        const viableCourseClassesArray: CourseClass[][] = [];
        for(const courseId of viableCourseIds) {
            const classIds = viableCourseClassesMap.get(courseId);
            if(classIds){
                const classes: CourseClass[] = [];
                for(const ccId of classIds){
                    const cc = inputData.courseClasses.get(ccId);
                    if(cc) classes.push(cc);
                }
                if(classes.length > 0)
                    viableCourseClassesArray.push(classes);
            }
        }
        return viableCourseClassesArray;
    }


    // Since getting all combinations takes too long, the following sacrifices have been made:
    // -- When deadline is passed, the function will return all valid combinations found so far
    // -- While valid, combinations that stray too far beyond targetHours are ignored to avoid expanding them
    private getCourseClassCombinations(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[], targetHours: number, maxOptionalCourseCredits: number, deadline: Date): CourseClass[][] {
        const viableCourseClassesArray = this.getSortedViableCourseClassesArray(inputData, unavailableTimeSlots);
        let index = viableCourseClassesArray.length-1;
        let validCombos: CourseClass[][] = [];
        let validCombosOptionalCredits: number[] = []; // Each index contains the amount of optioanl course credits earned from the combination in the same index on validCombos

        // Start from most important course (at the end of array) and work our way to less important ones
        while(index >= 0 && new Date() < deadline) {
            // Calculate this course's impact on proposed combinations' optionalCourseCredits
            const courseId = inputData.courseOfCourseClass.get(viableCourseClassesArray[index][0].id);
            if(!courseId) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            const course = inputData.courses.get(courseId);
            if(!course) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            const courseOptionalCredits = inputData.optionalCourseIds.includes(courseId)? course.creditValue : 0;

            const newValidCombos: CourseClass[][] = [];
            const newValidCombosOptionalCredits: number[] = [];

            // Schedules that only contain a class of our current course are a possibility
            for(const cc of viableCourseClassesArray[index]){
                newValidCombos.push([cc]);
                newValidCombosOptionalCredits.push(courseOptionalCredits);
            }

            for (let i=0; i < validCombos.length; i++) {
                const combo = validCombos[i];
                const comboOptionalCredits = validCombosOptionalCredits[i];

                // Skip this course if adding it makes the combo exceed the max amount of optional credits we can suggest
                if(courseOptionalCredits > 0 && comboOptionalCredits > maxOptionalCourseCredits)
                    continue;

                // If adding a class belonging to the current course to an existing combo is valid, push it to the array
                for (const cc of viableCourseClassesArray[index]) {
                    if(new Date() > deadline)
                        return validCombos.concat(newValidCombos);

                    const combinationProposal = [cc, ...combo];
                    const combinationProposalCredits = comboOptionalCredits + courseOptionalCredits
                    let weeklyMinutes = 0;
                    for(const courseClass of combinationProposal) {
                        const classDuration = inputData.weeklyClassTimeInMinutes.get(courseClass.id);
                        if(!classDuration) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                        weeklyMinutes += classDuration;
                    }
                    const weeklyHours = weeklyMinutes/60;

                    if(weeklyHours <= targetHours*1.25 && this.isClassCombinationValid(combinationProposal, inputData)){
                        newValidCombos.push(combinationProposal);
                        newValidCombosOptionalCredits.push(comboOptionalCredits + courseOptionalCredits);
                    }
                }
            }

            // Add all new combinations that contain the current course to validCombos
            // This is done outside the loop to avoid growing validCombos and iterating forever
            validCombos = validCombos.concat(newValidCombos);
            validCombosOptionalCredits = validCombosOptionalCredits.concat(newValidCombosOptionalCredits);
            index -= 1;
        }

        return validCombos;
    }

    private isClassCombinationValid(courseClasses: CourseClass[], inputData: IScheduleInputData): boolean {
        for(let i=0; i < courseClasses.length-1; i++){
            for(let j=i+1; j < courseClasses.length; j++){
                const lectures1 = inputData.lecturesOfCourseClass.get(courseClasses[i].id);
                const lectures2 = inputData.lecturesOfCourseClass.get(courseClasses[j].id);
                if(!lectures1 || !lectures2) return false
                for(const lectureId1 of lectures1) {
                    const l1 = inputData.lectures.get(lectureId1);
                    if (!l1) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                    for(const lectureId2 of lectures2) {
                        const l2 = inputData.lectures.get(lectureId2);
                        if (!l2) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

                        // STEP 7a - Only one courseClass per Course (Guaranteed in steps 5-6)
                        // STEP 7b - Lectures should not overlap
                        const gap = l1.time.getGapInMinutesAgainst(l2.time);
                        if(gap < 0) return false;

                        // STEP 7c - No unavailable time between buildings
                        const b1 = inputData.lectureBuilding.get(l1.id);
                        const b2 = inputData.lectureBuilding.get(l2.id);
                        if(b1 && b2 && b1 !== b2) {
                            let distancesOfB = inputData.distances.get(b1);
                            let distance = distancesOfB?.get(b2);
                            if(!distance){
                                // Check if reverse relationship is defined
                                distancesOfB = inputData.distances.get(b2);
                                distance = distancesOfB?.get(b1);
                            }

                            if(gap < (distance ?? DEFAULT_DISTANCE)) return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    private createSchedule(courseClasses: CourseClass[], inputData: IScheduleInputData): ISchedule {
        let totalMinutes = 0;
        let totalDays = new Set();
        let totalImportance = 0;
        let amountOfMandatoryCourses = 0;
        let earliestLecture = Time.maxValue();
        let latestLecture = Time.minValue();

        for(const cc of courseClasses) {
            const courseId = inputData.courseOfCourseClass.get(cc.id);
            const lectures = inputData.lecturesOfCourseClass.get(cc.id);
            if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

            const classImportance = inputData.indirectCorrelativesAmount.get(courseId);
            if(classImportance === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalImportance += classImportance;

            if(inputData.mandatoryCourseIds.includes(courseId)) amountOfMandatoryCourses++;

            for(const lectureId of lectures){
                const l = inputData.lectures.get(lectureId);
                if (!l) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                totalMinutes += l.time.getDurationInMinutes();
                totalDays.add(l.time.dayOfWeek);
                if (!earliestLecture || l.time.startTime < earliestLecture) earliestLecture = l.time.startTime;;
                if (!latestLecture || l.time.endTime > latestLecture) latestLecture = l.time.endTime;
            }
        }

        return {
            courseClasses: courseClasses,
            totalHours: totalMinutes/60,
            totalDays: totalDays.size,
            totalImportance: totalImportance,
            mandatoryRate: amountOfMandatoryCourses / courseClasses.length,
            earliestLecture: earliestLecture,
            latestLecture: latestLecture,
        }
    }

    private calculateScheduleScore(schedule: ISchedule, targetHours: number, reduceDays: boolean, prioritizeUnlocks: boolean): number {
        const p1 = schedule.mandatoryRate;
        const p2 = Math.abs(targetHours - schedule.totalHours);
        const p3 = 7 - schedule.totalDays;
        const p4 = schedule.totalImportance;
        const a = (reduceDays)? 1:0;
        const b = (prioritizeUnlocks)? 1:0;
        return 10*p1 - 1.25*p2 + a*3.5*p3 + b*p4
    }
}
