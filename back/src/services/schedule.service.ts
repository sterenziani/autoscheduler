import { IScheduleInputData } from '../interfaces/schedule.interface';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import ScheduleDao from '../persistence/abstract/schedule.dao';
import ScheduleDaoFactory from '../factories/scheduleDao.factory';
import Program from '../models/abstract/program.model';
import StudentService from './student.service';
import ProgramService from './program.service';
import TermService from './term.service';
import Course from '../models/abstract/course.model';
import CourseClass from '../models/abstract/courseClass.model';
import {ISchedule, IScheduleWithScore} from '../interfaces/schedule.interface';
import Lecture from '../models/abstract/lecture.model';
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
        // STEPS 1-5 - Get and filter information needed
        const inputData: IScheduleInputData = await this.dao.getScheduleInfo(universityId, programId, termId, studentId, unavailableTimeSlots);

        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        const deadline = new Date(Date.now() + MINUTE_IN_MS)
        const courseClassCombinations = this.getCourseClassCombinations(inputData, targetHours, deadline);

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

    private getSortedViableCourseClassesArray(inputData: IScheduleInputData): CourseClass[][] {
        const mandatoryIds = inputData.mandatoryCourseIds;
        const importance = inputData.indirectCorrelativesAmount;
        const viableCourseClassesMap = inputData.viableCourseClasses;
        const viableCourseIds: string[] = Array.from(viableCourseClassesMap.keys());

        // Sort course IDs by their importance (in case of a draw, mandatory courses take proirity)
        viableCourseIds.sort((c1,c2) => {
            const importance1 = importance.get(c1);
            const importance2 = importance.get(c2);
            if(importance1 == importance2) {
                if(mandatoryIds.includes(c1) && !mandatoryIds.includes(c2)) return 1;
                if(!mandatoryIds.includes(c1) && mandatoryIds.includes(c2)) return -1;
                return 0;
            }
            if(!importance1 || !importance2) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
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
                viableCourseClassesArray.push(classes);
            }
        }
        return viableCourseClassesArray;
    }

    private getCourseClassCombinations(inputData: IScheduleInputData, targetHours: number, deadline: Date): CourseClass[][] {
        const viableCourseClassesArray = this.getSortedViableCourseClassesArray(inputData);
        let index = viableCourseClassesArray.length-1;
        let validCombos: CourseClass[][] = [];

        // Start from most important course (at the end of array) and work our way to less important ones
        while(index >= 0 && new Date() < deadline) {
            const newValidCombos: CourseClass[][] = [];

            // Schedules that only contain a class of our current course are a possibility
            for(const cc of viableCourseClassesArray[index]) newValidCombos.push([cc]);

            for (const combo of validCombos) {
                // If adding a class belonging to the current course to an existing combo is valid, push it to the array
                for (const cc of viableCourseClassesArray[index]) {
                    if(new Date() > deadline) return validCombos.concat(newValidCombos);

                    const combinationProposal = [cc, ...combo];
                    let weeklyMinutes = 0;
                    for(const courseClass of combinationProposal) {
                        const classDuration = inputData.weeklyClassTimeInMinutes.get(courseClass.id);
                        if(!classDuration) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                        weeklyMinutes += classDuration;
                    }
                    const weeklyHours = weeklyMinutes/60;

                    if(weeklyHours <= targetHours*1.25 && this.isClassCombinationValid(combinationProposal, inputData))
                        newValidCombos.push(combinationProposal);
                }
            }

            // Add all new combinations that contain the current course to validCombos
            // This is done outside the loop to avoid growing validCombos and iterating forever
            validCombos = validCombos.concat(newValidCombos);
            index -= 1;
        }

        return validCombos;
    }

    private isClassCombinationValid(courseClasses: CourseClass[], inputData: IScheduleInputData): boolean {
        for(let i=0; i < courseClasses.length-1; i++){
            for(let j=i+1; j < courseClasses.length; j++){
                const lectures1 = inputData.lectures.get(courseClasses[i].id);
                const lectures2 = inputData.lectures.get(courseClasses[j].id);
                if(!lectures1 || !lectures2) return false
                for(const l1 of lectures1) {
                    for(const l2 of lectures2) {
                        // STEP 7a - Only one courseClass per Course (Guaranteed in steps 5-6)
                        // STEP 7b - Lectures should not overlap
                        const gap = l1.time.getGapInMinutesAgainst(l2.time);
                        if(gap < 0) return false;

                        // STEP 7c - No unavailable time between buildings
                        const b1 = inputData.lectureBuildings.get(l1.id);
                        const b2 = inputData.lectureBuildings.get(l2.id);
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
            const lectures = inputData.lectures.get(cc.id);
            if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

            const classImportance = inputData.indirectCorrelativesAmount.get(courseId);
            if(!classImportance) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalImportance += classImportance;

            if(inputData.mandatoryCourseIds.includes(courseId)) amountOfMandatoryCourses++;

            for(const l of lectures){
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
