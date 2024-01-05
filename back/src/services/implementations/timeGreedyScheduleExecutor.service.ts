import { ERRORS } from "../../constants/error.constants";
import { SCHEDULE_ALGORITHM } from "../../constants/schedule.constants";
import { DAY } from "../../constants/time.constants";
import GenericException from "../../exceptions/generic.exception";
import { IAlgorithmParams, IScheduleData, IScheduleInputData, IScheduleMetrics, IScheduleParams, IScheduleWithScore, ScoreMethod } from "../../interfaces/schedule.interface";
import ScheduleExecutorService from "../scheduleExecutor.service";

export default class TimeGreedyScheduleExecutorService extends ScheduleExecutorService {
    private static instance: TimeGreedyScheduleExecutorService;

    static getInstance(): TimeGreedyScheduleExecutorService {
        if (!TimeGreedyScheduleExecutorService.instance) {
            TimeGreedyScheduleExecutorService.instance = new TimeGreedyScheduleExecutorService(SCHEDULE_ALGORITHM.TIME_GREEDY);
        }
        return TimeGreedyScheduleExecutorService.instance;
    }
    
    getSchedules(
        algorithmParams: IAlgorithmParams,
        scoreMethod: ScoreMethod,
        scheduleParams: IScheduleParams,
        inputData: IScheduleInputData,
        deadline?: Date | undefined,
        debug?: boolean | undefined,
    ): IScheduleWithScore[] {
        const startTimestamp = new Date();
        let processedCombos = 0;

        const targetMinutes = Math.floor(scheduleParams.targetHours * 60);
        const minMinutes = Math.min(...inputData.weeklyClassTimeInMinutes.values());
        const maxMinutes = Math.max(...inputData.weeklyClassTimeInMinutes.values());
        const stepMinutes = this.getStep(inputData);
        const expireMinutes = stepMinutes * Math.ceil(maxMinutes / stepMinutes);
        
        const scheduleDataMap: Map<number, IScheduleData[]> = new Map();
        const insertedCombos = new Set<string>();
        const currentStepCache: Map<string, IScheduleData> = new Map();
        const currentBest: Map<string, IScheduleData[]> = new Map();

        let firstMinutes = targetMinutes % stepMinutes;
        while (firstMinutes + stepMinutes < minMinutes) firstMinutes += stepMinutes;
        let currentMinutes = firstMinutes;

        // fill first step with empty array
        scheduleDataMap.set(currentMinutes, []);
        for (const courseClassId of Object.keys(inputData.courseClasses)) {
            currentBest.set(courseClassId, []);
        }
        currentMinutes+=stepMinutes;

        while(currentMinutes <= targetMinutes && processedCombos < algorithmParams.maxSchedulesToProcess && (!deadline || new Date() < deadline)) {
            scheduleDataMap.set(currentMinutes, []);

            for (const currentCourseClassId of Object.keys(inputData.courseClasses)) {
                const courseId = inputData.courseOfCourseClass.get(currentCourseClassId);
                if(!courseId) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

                const courseClassMinutes = inputData.weeklyClassTimeInMinutes.get(currentCourseClassId);
                if (courseClassMinutes === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                // if the course can't be included we just skip this step
                if (currentMinutes - courseClassMinutes < 0) continue;

                // if previous is empty then we want to define the set with only this value
                if ((currentBest.get(currentCourseClassId)?.length ?? 0) < 1) {
                    const firstScheduleDataCache = this.addToScheduleDataCache(currentCourseClassId, this.generateScheduleDataCache(), inputData, scheduleParams, scoreMethod);
                    currentBest.set(currentCourseClassId, [firstScheduleDataCache]);
                    currentStepCache.set([currentCourseClassId].toString(), firstScheduleDataCache);

                    processedCombos++;
                }

                // iterate courseClasses
                const closestStep = currentMinutes - courseClassMinutes;
                if (closestStep > firstMinutes) {
                    const otherSchedulesDataCache: IScheduleData[] = scheduleDataMap.get(closestStep) ?? [];
                    for (const otherScheduleDataCache of otherSchedulesDataCache) {
                        // we don't consider the other set if empty
                        if (!otherScheduleDataCache || otherScheduleDataCache.courseClassIds.size < 1) continue;
    
                        // check if courseClass is already included
                        if (otherScheduleDataCache.courseClassIds.has(currentCourseClassId)) continue;

                        // check if course is already included to otherCourseClasses
                        if (otherScheduleDataCache.courseIds.has(courseId)) continue;
    
                        // check overlaps & distance
                        if (!this.isClassCombinationValid(Array.from(otherScheduleDataCache.courseClassIds), currentCourseClassId, inputData.incompatibilityCache)) continue;
    
                        // check if better than currentBest
                        const newCourseClassesKey = Array.from(new Set(otherScheduleDataCache.courseClassIds).add(currentCourseClassId)).sort().toString();
                        const newScheduleDataCache = currentStepCache.get(newCourseClassesKey) ?? this.addToScheduleDataCache(currentCourseClassId, otherScheduleDataCache, inputData, scheduleParams, scoreMethod);
                        this.pushToScheduleDataArray(currentBest.get(currentCourseClassId)!, newScheduleDataCache, algorithmParams.bestPickedFromEachStep);
                        if (!currentStepCache.has(newCourseClassesKey)) currentStepCache.set(newCourseClassesKey, newScheduleDataCache);

                        processedCombos++;
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
            const courseClassIds = Array.from(scheduleData.courseClassIds);
            const schedule = this.createSchedule(courseClassIds, inputData);
            schedules.push({ schedule, score: scheduleData.score });
        }

        if (debug) console.log(`\n[${this.getName()}] Finished in ${((new Date().getTime()-startTimestamp.getTime())/1000)} seconds, processed ${processedCombos} combinations`);

        return schedules;
    }

    // AUX methods

    // push to sorted array of fixed length
    private pushToScheduleDataArray(scheduleDatas: IScheduleData[], newScheduleData: IScheduleData, dataLength: number): IScheduleData[] {
        const index = scheduleDatas.findIndex(sdc => sdc.score < newScheduleData.score);
        if (index === -1) {
            scheduleDatas.push(newScheduleData);
        } else {
            scheduleDatas.splice(index, 0, newScheduleData);
        }

        // remove last element
        if (scheduleDatas.length > dataLength) {
            scheduleDatas.pop();
        }
        return scheduleDatas;
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

    private generateScheduleDataCache(): IScheduleData {
        return {
            courseClassIds: new Set<string>(),
            courseIds: new Set<string>(),
            scheduleMetrics: {
                optionalCourses: 0,
                totalCourses: 0,
                totalImportance: 0,
                totalMinutes: 0,
                totalDays: new Set<DAY>(),
            },
            score: 0,
        }
    }

    private addToScheduleDataCache(
        courseClassId: string,
        scheduleDataCache: IScheduleData,
        inputData: IScheduleInputData,
        scheduleParams: IScheduleParams,
        scoreMethod: (scheduleMetrics: IScheduleMetrics, scheduleParams: IScheduleParams) => number,
        ): IScheduleData {
        const courseId = inputData.courseOfCourseClass.get(courseClassId);
        const lectures = inputData.lecturesOfCourseClass.get(courseClassId);
        const weeklyClassTimeInMinutes = inputData.weeklyClassTimeInMinutes.get(courseClassId);
        if(courseId === undefined || lectures === undefined || weeklyClassTimeInMinutes === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

        const isOptional = inputData.optionalCourseIds.has(courseId);
        const courseImportance = inputData.indirectCorrelativesAmount.get(courseId);
        if (courseImportance === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

        const totalDays = new Set<DAY>(scheduleDataCache.scheduleMetrics.totalDays);
        for (const lectureId of lectures) {
            const lecture = inputData.lectures.get(lectureId);
            if(!lecture) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalDays.add(lecture.time.dayOfWeek);
        }

        const scheduleMetrics = {
            optionalCourses: scheduleDataCache.scheduleMetrics.optionalCourses + (isOptional?1:0),
            totalCourses: scheduleDataCache.scheduleMetrics.totalCourses + 1,
            totalImportance: scheduleDataCache.scheduleMetrics.totalImportance + courseImportance,
            totalMinutes: scheduleDataCache.scheduleMetrics.totalMinutes + weeklyClassTimeInMinutes,
            totalDays,
        };
        const score = scoreMethod(scheduleMetrics, scheduleParams);
        return {
            courseClassIds: (new Set<string>(scheduleDataCache.courseClassIds)).add(courseClassId),
            courseIds: (new Set<string>(scheduleDataCache.courseIds)).add(courseId),           
            scheduleMetrics,
            score,
        }
    }
}