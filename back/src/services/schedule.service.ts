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

const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60000;
const TARGET_HOUR_EXCEED_RATE_LIMIT = 1.25;
const SHUFFLE_FIXED_INDEXES = 3;
const MAX_COURSE_COMBOS_TO_PROCESS = 1000000;
const MAX_MS_DEADLINE_TO_PROCESS = 5*SECOND_IN_MS;

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
        unavailableTimeSlots: TimeRange[],
        amountToReturn: number=10,
        randomizeCourses: boolean=false
    ): Promise<IScheduleWithScore[]> {
        const startTimestamp = new Date();

        // STEPS 1-4 - Get all information needed
        const inputData: IScheduleInputData = await this.dao.getScheduleInfo(universityId, programId, termId, studentId);

        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots (done inside getCourseClassCombinations)
        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        const deadline = new Date(Date.now() + MAX_MS_DEADLINE_TO_PROCESS);
        const courseClassCombinations = this.getCourseClassCombinations(inputData, unavailableTimeSlots, targetHours, deadline, MAX_COURSE_COMBOS_TO_PROCESS, randomizeCourses);

        // STEP 8 - Calculate stats for every valid schedule
        // STEP 9 - Calculate score for each schedule
        const schedules = [];
        let lowestScore;

        // Iterate backwards to process schedules with more courses (likely better score) first
        for(let i=courseClassCombinations.length-1; i >= 0; i--){
            const combo = courseClassCombinations[i];
            const schedule = this.createSchedule(combo, inputData);
            const score = this.calculateScheduleScore(schedule, targetHours, reduceDays, prioritizeUnlocks);

            // lowestScore gets updated if we still don't have enough elements
            if(!lowestScore || (schedules.length < amountToReturn && score < lowestScore))
                lowestScore = score;

            // If we don't have enough elements yet, or the score is better than the worst in the collection, add it
            if(schedules.length < amountToReturn || score > lowestScore)
                schedules.push({schedule: schedule, score: score});
        }

        //console.log("Processed " +courseClassCombinations.length +" schedules (filtered down to " +schedules.length +") in " +((new Date().getTime()-startTimestamp.getTime())/1000)  +" seconds.\n");

        // STEP 10 - Return sorted list of schedules by score
        return schedules.sort((a, b) =>  b.score-a.score).slice(0, amountToReturn);
    }

    private areTimeRangesCompatible(timeRangeA: TimeRange[], timeRangeB: TimeRange[]): boolean {
        for (const tA of timeRangeA) {
            for (const tB of timeRangeB) {
                if(tA.overlaps(tB)) return false;
            }
        }
        return true;
    }

    // Returns map of courseClasses that don't overlap unavailableTimeSlots
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
        const viableCourseIds: string[] = inputData.mandatoryCourseIds.concat(inputData.optionalCourseIds);

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

            const course = inputData.courses.get(courseId);
            if(!course) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
        }
        return viableCourseClassesArray;
    }


    // Since getting all combinations takes too long, the following sacrifices have been made:
    // -- When deadline is passed, the function will return all valid combinations found so far
    // -- While valid, combinations that stray too far beyond targetHours are ignored to avoid expanding them
    private getCourseClassCombinations(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[], targetHours: number, deadline: Date, combinationLimit: number, randomizeCourses: boolean): CourseClass[][] {
        const viableCourseClassesArray = this.getSortedViableCourseClassesArray(inputData, unavailableTimeSlots);
        if(randomizeCourses){
            for (let i = viableCourseClassesArray.length-1; i > SHUFFLE_FIXED_INDEXES; i--) {
                const j = SHUFFLE_FIXED_INDEXES + Math.floor(Math.random() * (i + 1 - SHUFFLE_FIXED_INDEXES+1));
                [viableCourseClassesArray[i], viableCourseClassesArray[j]] = [viableCourseClassesArray[j], viableCourseClassesArray[i]];
            }
        }

        let validCombos: CourseClass[][] = [];
        let validCombosOptionalCredits: number[] = []; // Each index contains the amount of optioanl course credits earned from the combination in the same index on validCombos

        // Start from most important course (at the end of array) and work our way to less important ones
        const ccCompatibleCache: Map<string, Map<string, boolean>> = new Map();
        const startLoop = new Date().getTime()
        let index = 0;
        while(index < viableCourseClassesArray.length && new Date() < deadline && validCombos.length < combinationLimit) {
            // Calculate this course's impact on proposed combinations' optionalCourseCredits
            const courseId = inputData.courseOfCourseClass.get(viableCourseClassesArray[index][0].id);
            if(!courseId) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            const course = inputData.courses.get(courseId);
            if(!course) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            const courseOptionalCredits = inputData.optionalCourseIds.includes(courseId)? course.creditValue : 0;


            //console.log("\t" +((new Date().getTime()-startLoop)/1000) +" secs into loop, have processed " +validCombos.length +" combinations so far. Now considering combinations that include " +course.name +". Imporance: " +inputData.indirectCorrelativesAmount.get(course.id));


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

                // Skip this course if this combo already exceeds the max amount of optional credits we can suggest
                if(courseOptionalCredits > 0 && comboOptionalCredits > inputData.remainingOptionalCredits)
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

                    if(weeklyHours <= targetHours*TARGET_HOUR_EXCEED_RATE_LIMIT && this.isClassCombinationValid(combinationProposal, inputData, ccCompatibleCache)){
                        newValidCombos.push(combinationProposal);
                        newValidCombosOptionalCredits.push(comboOptionalCredits + courseOptionalCredits);
                    }
                }
            }

            // Add all new combinations that contain the current course to validCombos
            // This is done outside the loop to avoid growing validCombos and iterating forever
            validCombos = validCombos.concat(newValidCombos);
            validCombosOptionalCredits = validCombosOptionalCredits.concat(newValidCombosOptionalCredits);
            index += 1;
        }

        return validCombos;
    }

    // To save on memory, alphabetically earliest ID serves as the key
    private checkClassCompatibilityCache(ccId1: string, ccId2:string, ccCompatibleCache: Map<string, Map<string, boolean>>): boolean|undefined {
        if(ccId2 < ccId1) [ccId1, ccId2] = [ccId2, ccId1];
        return ccCompatibleCache.get(ccId1)?.get(ccId2);
    }

    // To save on memory, alphabetically earliest ID serves as the key
    private updateClassCompatibilityCache(ccId1: string, ccId2:string, ccCompatibleCache: Map<string, Map<string, boolean>>, value: boolean) {
        if(ccId2 < ccId1) [ccId1, ccId2] = [ccId2, ccId1];

        if(!ccCompatibleCache.get(ccId1))
            ccCompatibleCache.set(ccId1, new Map());
        ccCompatibleCache.get(ccId1)?.set(ccId2, value);
    }

    // Checks for lecture overlaps and building distances
    private isClassCombinationValid(courseClasses: CourseClass[], inputData: IScheduleInputData, ccCompatibleCache: Map<string, Map<string, boolean>>): boolean {
        for(let i=0; i < courseClasses.length-1; i++){
            for(let j=i+1; j < courseClasses.length; j++){
                // Check if we already compared these two courses
                const cache = this.checkClassCompatibilityCache(courseClasses[i].id, courseClasses[j].id, ccCompatibleCache);
                if(cache == false) return cache;
                if(cache == true) continue;

                const lectures1 = inputData.lecturesOfCourseClass.get(courseClasses[i].id);
                const lectures2 = inputData.lecturesOfCourseClass.get(courseClasses[j].id);
                if(!lectures1 || !lectures2){
                    this.updateClassCompatibilityCache(courseClasses[i].id, courseClasses[j].id, ccCompatibleCache, false);
                    return false;
                }

                for(const lectureId1 of lectures1) {
                    const l1 = inputData.lectures.get(lectureId1);
                    if (!l1) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                    for(const lectureId2 of lectures2) {
                        const l2 = inputData.lectures.get(lectureId2);
                        if (!l2) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

                        // STEP 7a - Only one courseClass per Course (Guaranteed in steps 5-6)
                        // STEP 7b - Lectures should not overlap
                        const gap = l1.time.getGapInMinutesAgainst(l2.time);
                        if(gap < 0){
                            this.updateClassCompatibilityCache(courseClasses[i].id, courseClasses[j].id, ccCompatibleCache, false);
                            return false;
                        }

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

                            if(gap < (distance ?? DEFAULT_DISTANCE)){
                                this.updateClassCompatibilityCache(courseClasses[i].id, courseClasses[j].id, ccCompatibleCache, false);
                                return false;
                            }
                        }
                    }
                }
                // These two classes are compatible
                this.updateClassCompatibilityCache(courseClasses[i].id, courseClasses[j].id, ccCompatibleCache, true);
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
                if (l.time.startTime < earliestLecture) earliestLecture = l.time.startTime;;
                if (l.time.endTime > latestLecture) latestLecture = l.time.endTime;
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
