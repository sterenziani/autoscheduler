import { IScheduleDataCache, IScheduleInputData, IScheduleParams } from '../interfaces/schedule.interface';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import ScheduleDao from '../persistence/abstract/schedule.dao';
import ScheduleDaoFactory from '../factories/scheduleDao.factory';
import CourseClass from '../models/abstract/courseClass.model';
import {ISchedule, IScheduleWithScore} from '../interfaces/schedule.interface';
import Time from '../helpers/classes/time.class';
import TimeRange from '../helpers/classes/timeRange.class';
import { DEFAULT_DISTANCE } from '../constants/schedule.constants';
import { DAY } from '../constants/time.constants';

const SECOND_IN_MS = 1000;
const MAX_MS_DEADLINE_TO_PROCESS = 60*SECOND_IN_MS; // TODO reduce amount once tested
const SAVED_RANKING = 3; // must be < 1

export default class ScheduleService {
    private static instance: ScheduleService;
    private dao: ScheduleDao;

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
        // Initialize
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
        amountToReturn=10
    ): Promise<IScheduleWithScore[]> {

        const scheduleParams: IScheduleParams = { targetHours, reduceDays, prioritizeUnlocks };

        // STEPS 1-4 - Get all information needed
        const inputData: IScheduleInputData = await this.dao.getScheduleInfo(universityId, programId, termId, studentId);

        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots (done inside getCourseClassCombinations)
        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        const deadline = new Date(Date.now() + MAX_MS_DEADLINE_TO_PROCESS);
        // TODO: input.data.courceClasses should already only have viable courceClasses
        const courseClasses = this.getViableCourseClasses(inputData, unavailableTimeSlots);

        // Exit early if no courseClasses
        if (courseClasses.length < 1) return [];

        const targetMinutes = Math.floor(targetHours * 60);
        const minMinutes = Math.min(...inputData.weeklyClassTimeInMinutes.values());
        const maxMinutes = Math.max(...inputData.weeklyClassTimeInMinutes.values());
        const stepMinutes = this.getStep(inputData);
        const expireMinutes = stepMinutes * Math.ceil(maxMinutes / stepMinutes);
        const ccCompatibleCache: Map<string, Map<string, boolean>> = new Map();
        
        const scheduleDataMap: Map<number, IScheduleDataCache[]> = new Map();
        const insertedCombos = new Set<string>();
        const currentStepCache: Map<string, IScheduleDataCache> = new Map();
        const currentBest: Map<string, IScheduleDataCache[]> = new Map();

        let firstMinutes = targetMinutes % stepMinutes;
        while (firstMinutes + stepMinutes < minMinutes) firstMinutes += stepMinutes;
        let currentMinutes = firstMinutes;

        // fill first step with empty array
        scheduleDataMap.set(currentMinutes, []);
        for (const courseClassId of courseClasses) {
            currentBest.set(courseClassId, []);
        }
        currentMinutes+=stepMinutes;

        while(currentMinutes <= targetMinutes && new Date() < deadline) {
            scheduleDataMap.set(currentMinutes, []);

            for (const currentCourseClassId of courseClasses) {
                const courseId = inputData.courseOfCourseClass.get(currentCourseClassId);
                if(!courseId) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

                const courseClassMinutes = inputData.weeklyClassTimeInMinutes.get(currentCourseClassId);
                if (courseClassMinutes === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                // if the course can't be included we just skip this step
                if (currentMinutes - courseClassMinutes < 0) continue;

                // if previous is empty then we want to define the set with only this value
                if ((currentBest.get(currentCourseClassId)?.length ?? 0) < 1) {
                    const firstScheduleDataCache = this.addToScheduleDataCache(currentCourseClassId, this.generateScheduleDataCache(), inputData, scheduleParams)
                    currentBest.set(currentCourseClassId, [firstScheduleDataCache]);
                    currentStepCache.set([currentCourseClassId].toString(), firstScheduleDataCache);
                }

                // iterate courseClasses
                const closestStep = currentMinutes - courseClassMinutes;
                if (closestStep > firstMinutes) {
                    const otherSchedulesDataCache: IScheduleDataCache[] = scheduleDataMap.get(closestStep) ?? [];
                    for (const otherScheduleDataCache of otherSchedulesDataCache) {
                        // we don't consider the other set if empty
                        if (!otherScheduleDataCache || otherScheduleDataCache.courseClassIds.size < 1) continue;
    
                        // check if courseClass is already included
                        if (otherScheduleDataCache.courseClassIds.has(currentCourseClassId)) continue;

                        // check if course is already included to otherCourseClasses
                        if (otherScheduleDataCache.courseIds.has(courseId)) continue;
    
                        // check overlaps & distance
                        if (!this.isClassCombinationValid(otherScheduleDataCache.courseClassIds, currentCourseClassId, inputData, ccCompatibleCache)) continue;
    
                        // check if better than currentBest
                        const newCourseClassesKey = Array.from(new Set(otherScheduleDataCache.courseClassIds).add(currentCourseClassId)).sort().toString();
                        const newScheduleDataCache = currentStepCache.get(newCourseClassesKey) ?? this.addToScheduleDataCache(currentCourseClassId, otherScheduleDataCache, inputData, scheduleParams);
                        this.pushToScheduleDataCacheArray(currentBest.get(currentCourseClassId)!, newScheduleDataCache);
                        if (!currentStepCache.has(newCourseClassesKey)) currentStepCache.set(newCourseClassesKey, newScheduleDataCache);
                    }
                }

                // update best for currentCourseClassId
                for (const scheduleCache of currentBest.get(currentCourseClassId)!) {
                    const currentComboKey = Array.from(scheduleCache.courseClassIds).sort().toString();
                    // duplication check
                    if (insertedCombos.has(currentComboKey)) continue;

                    scheduleDataMap.get(currentMinutes)?.push(scheduleCache);
                    insertedCombos.add(currentComboKey);
                }
            }

            // delete no longer needed values
            currentStepCache.clear();
            insertedCombos.clear();
            if (scheduleDataMap.has(currentMinutes-expireMinutes)) {
                scheduleDataMap.delete(currentMinutes-expireMinutes);
            }
            
            // increase currentMinutes
            currentMinutes+=stepMinutes;
        }

        // convert to schedules
        const schedules: IScheduleWithScore[] = [];
        for (const scheduleData of scheduleDataMap.get(currentMinutes-stepMinutes) ?? []) {
            const courseClasses = Array.from(scheduleData.courseClassIds);
            const schedule = this.createSchedule(courseClasses, inputData);
            schedules.push({ schedule, score: scheduleData.score });
        }
        
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

    // TODO this should be handled by db
    // Returns all viable course classes
    private getViableCourseClasses(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[]): string[] {
        const viableCourseClasses: string[] = [];
        const ccIds = inputData.courseClasses.keys() ?? [];
            for(const ccId of ccIds) {
                const ccLectureIds = inputData.lecturesOfCourseClass.get(ccId) ?? [];
                const ccLectureTimes: TimeRange[] = [];
                for(const lectureId of ccLectureIds){
                    const l = inputData.lectures.get(lectureId);
                    if(l !== undefined) ccLectureTimes.push(l.time);
                }
                if(this.areTimeRangesCompatible(ccLectureTimes, unavailableTimeSlots))
                    viableCourseClasses.push(ccId);
            }
        return viableCourseClasses;
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
    private isClassCombinationValid(validCourseClassIds: Set<string>, newCourceClassId: string, inputData: IScheduleInputData, ccCompatibleCache: Map<string, Map<string, boolean>>): boolean {
        const newCourceClassLectures = inputData.lecturesOfCourseClass.get(newCourceClassId);
        if (!newCourceClassLectures) return false;
        
        for (const validCourceClassId of validCourseClassIds) {
            // Check if we already compared these two courses
            const cache = this.checkClassCompatibilityCache(newCourceClassId, validCourceClassId, ccCompatibleCache);
            if(cache == false) return cache;
            if(cache == true) continue;
            
            const validCourceClassLectures = inputData.lecturesOfCourseClass.get(validCourceClassId);
            if (!validCourceClassLectures){
                this.updateClassCompatibilityCache(newCourceClassId, validCourceClassId, ccCompatibleCache, false);
                return false;
            }

            // check lectures
            for (const newCourceClassLectureId of newCourceClassLectures) {
                const newCourceClassLecture = inputData.lectures.get(newCourceClassLectureId);
                if (!newCourceClassLecture) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                for (const validCourceClassLectureId of validCourceClassLectures) {
                    const validCourceClassLecture = inputData.lectures.get(validCourceClassLectureId);
                    if (!validCourceClassLecture) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

                    // STEP 7a - Only one courseClass per Course (Guaranteed in steps 5-6)
                    // STEP 7b - Lectures should not overlap
                    const gap = newCourceClassLecture.time.getGapInMinutesAgainst(validCourceClassLecture.time);
                    if(gap < 0){
                        this.updateClassCompatibilityCache(newCourceClassId, validCourceClassId, ccCompatibleCache, false);
                        return false;
                    }

                    // STEP 7c - No unavailable time between buildings
                    const b1 = inputData.lectureBuilding.get(newCourceClassId);
                    const b2 = inputData.lectureBuilding.get(validCourceClassId);
                    if(b1 && b2 && b1 !== b2) {
                        let distancesOfB = inputData.distances.get(b1);
                        let distance = distancesOfB?.get(b2);
                        if(!distance){
                            // Check if reverse relationship is defined
                            distancesOfB = inputData.distances.get(b2);
                            distance = distancesOfB?.get(b1);
                        }

                        if(gap < (distance ?? DEFAULT_DISTANCE)){
                            this.updateClassCompatibilityCache(newCourceClassId, validCourceClassId, ccCompatibleCache, false);
                            return false;
                        }
                    }
                }
            }

            // These two classes are compatible
            this.updateClassCompatibilityCache(newCourceClassId, validCourceClassId, ccCompatibleCache, true);
        }
        return true;
    }

    private getStep(inputData: IScheduleInputData): number {
        if (inputData.weeklyClassTimeInMinutes.size < 1) return 0;
        const valuesArray = Array.from(inputData.weeklyClassTimeInMinutes.values()).sort((a, b) => a - b);
        valuesArray.unshift(0)
        let minDifference = Infinity;

        for (let i = 1; i < valuesArray.length; i++) {
            const currentDifference = valuesArray[i] - valuesArray[i - 1];
            if (currentDifference > 0) minDifference = Math.min(minDifference, currentDifference);
        }

        return minDifference;
    }

    // TODO use scheduleData instead
    private createSchedule(courseClassIds: string[], inputData: IScheduleInputData): ISchedule {
        let totalMinutes = 0;
        const totalDays = new Set();
        let totalImportance = 0;
        let amountOfMandatoryCourses = 0;
        let earliestLecture = Time.maxValue();
        let latestLecture = Time.minValue();

        for(const ccId of courseClassIds) {
            const courseId = inputData.courseOfCourseClass.get(ccId);
            const lectures = inputData.lecturesOfCourseClass.get(ccId);
            if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

            const classImportance = inputData.indirectCorrelativesAmount.get(courseId);
            if(classImportance === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalImportance += classImportance;

            if(inputData.mandatoryCourseIds.has(courseId)) amountOfMandatoryCourses++;

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
            courseClasses: courseClassIds.map(ccId => inputData.courseClasses.get(ccId)).filter(cc => cc !== undefined) as CourseClass[],
            totalHours: totalMinutes/60,
            totalDays: totalDays.size,
            totalImportance,
            mandatoryRate: amountOfMandatoryCourses / courseClassIds.length,
            earliestLecture,
            latestLecture,
        };
    }

    private generateScheduleDataCache(): IScheduleDataCache {
        return {
            courseClassIds: new Set<string>(),
            courseIds: new Set<string>(),
            optionalCourses: 0,
            totalImportance: 0,
            totalMinutes: 0,
            totalDays: new Set<DAY>(),
            score: 0,
        }
    }

    private addToScheduleDataCache(courseClassId: string, scheduleDataCache: IScheduleDataCache, inputData: IScheduleInputData, scheduleParams: IScheduleParams): IScheduleDataCache {
        const courseId = inputData.courseOfCourseClass.get(courseClassId);
        const lectures = inputData.lecturesOfCourseClass.get(courseClassId);
        const weeklyClassTimeInMinutes = inputData.weeklyClassTimeInMinutes.get(courseClassId);
        if(courseId === undefined || lectures === undefined || weeklyClassTimeInMinutes === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

        const isOptional = inputData.optionalCourseIds.has(courseId);
        const courseImportance = inputData.indirectCorrelativesAmount.get(courseId);
        if (courseImportance === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

        const totalDays = new Set<DAY>(scheduleDataCache.totalDays);
        for (const lectureId of lectures) {
            const lecture = inputData.lectures.get(lectureId);
            if(!lecture) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalDays.add(lecture.time.dayOfWeek);
        }

        const newScheduleDataCache: IScheduleDataCache = {
            courseClassIds: (new Set<string>(scheduleDataCache.courseClassIds)).add(courseClassId),
            courseIds: (new Set<string>(scheduleDataCache.courseIds)).add(courseId),
            optionalCourses: scheduleDataCache.optionalCourses + (isOptional?1:0),
            totalImportance: scheduleDataCache.totalImportance + courseImportance,
            totalMinutes: scheduleDataCache.totalMinutes + weeklyClassTimeInMinutes,
            totalDays,
            score: 0,
        }
        newScheduleDataCache.score = this.calculateScheduleScore(newScheduleDataCache, scheduleParams);
        return newScheduleDataCache;
    }

    // push to sorted array of SAVED_RANKING elements
    private pushToScheduleDataCacheArray(scheduleDataCaches: IScheduleDataCache[], newScheduleDataCache: IScheduleDataCache): IScheduleDataCache[] {
        const index = scheduleDataCaches.findIndex(sdc => sdc.score < newScheduleDataCache.score);
        if (index === -1) {
            scheduleDataCaches.push(newScheduleDataCache);
        } else {
            scheduleDataCaches.splice(index, 0, newScheduleDataCache);
        }

        // remove last element
        if (scheduleDataCaches.length > SAVED_RANKING) {
            scheduleDataCaches.pop();
        }
        return scheduleDataCaches;
    }

    private calculateScheduleScore(scheduleDataCache: IScheduleDataCache, scheduleParams: IScheduleParams): number {
        const p1 = 1 - (scheduleDataCache.optionalCourses / scheduleDataCache.courseClassIds.size);
        const p2 = Math.abs(scheduleParams.targetHours - (scheduleDataCache.totalMinutes / 60));
        const p3 = 7 - scheduleDataCache.totalDays.size;
        const p4 = scheduleDataCache.totalImportance;
        const a = (scheduleParams.reduceDays)? 1:0;
        const b = (scheduleParams.prioritizeUnlocks)? 1:0;

        return 10*p1 - 1.25*p2 + a*3.5*p3 + b*p4;
    }
}
