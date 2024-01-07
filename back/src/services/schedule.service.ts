import { IScheduleInputData, IScheduleMetrics, IScheduleParams } from '../interfaces/schedule.interface';
import ScheduleDao from '../persistence/abstract/schedule.dao';
import ScheduleDaoFactory from '../factories/scheduleDao.factory';
import CourseClass from '../models/abstract/courseClass.model';
import {IScheduleWithScore, IAlgorithmParams} from '../interfaces/schedule.interface';
import TimeRange from '../helpers/classes/timeRange.class';
import { SCHEDULE_ALGORITHM } from '../constants/schedule.constants';
import { stringInEnum } from '../helpers/collection.helper';
import ScheduleExecutorService from './scheduleExecutor.service';
import CourseGreedyScheduleExecutorService from './implementations/courseGreedyScheduleExecutor.service';
import GeneticScheduleExecutorService from './implementations/geneticScheduleExecutor.service';
import TimeGreedyScheduleExecutorService from './implementations/timeGreedyScheduleExecutor.service';

const DEBUG = false;

export default class ScheduleService {
    private static instance: ScheduleService;
    private dao: ScheduleDao;

    private algorithmParams!: IAlgorithmParams;
    private scheduleExecutors!: Map<SCHEDULE_ALGORITHM, ScheduleExecutorService>;

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
        this.algorithmParams = {
            // common params
            selectedAlgorithm: stringInEnum(SCHEDULE_ALGORITHM, process.env.ALGORITHM) ? process.env.ALGORITHM as SCHEDULE_ALGORITHM : SCHEDULE_ALGORITHM.COURSE_GREEDY,
            maxSchedulesToProcess: parseInt(process.env.ALGORITHM_MAX_SCHEDULES_TO_PROCESS ?? '500000'),
            maxMsDeadlineToProcess: parseFloat(process.env.ALGORITHM_MAX_MS_DEADLINE_TO_PROCESS ?? '2000'),
            maxAmountToReturn: parseInt(process.env.ALGORITHM_MAX_AMOUNT_TO_RETURN ?? '10'),
            scoreMultipliers: [
                parseFloat(process.env.ALGORITHM_SCORE_P1_MULT ?? '10'),
                parseFloat(process.env.ALGORITHM_SCORE_P2_MULT ?? '1.25'),
                parseFloat(process.env.ALGORITHM_SCORE_P3_MULT ?? '3.5'),
                parseFloat(process.env.ALGORITHM_SCORE_P4_MULT ?? '1')
            ],

            // course greedy
            greedyPruning: ((process.env.ALGORITHM_GREEDY_PRUNING ?? 'true')=='true'),
            shuffleCourses: (process.env.ALGORITHM_SHUFFLE_COURSES=='true'),
            fixedIndexesDuringShuffle: parseInt(process.env.ALGORITHM_SHUFFLE_FIXED_INDEXES ?? '3'),
            targetHourExceedRateLimit: parseFloat(process.env.ALGORITHM_TARGET_HOUR_EXCEED_RATE_LIMIT ?? '1.25'),
            minAmountOfSchedulesToPruneByAvg: parseInt(process.env.ALGORITHM_MIN_AMOUNT_OF_SCHEDULES_TO_PRUNE_BY_AVG ?? '25'),
            minAmountOfProcessedCoursesToPruneByAvg: parseInt(process.env.ALGORITHM_MIN_AMOUNT_OF_PROCESSED_COURSES_TO_PRUNE_BY_AVG ?? '2'),
            minHoursToPruneByAvg: parseFloat(process.env.ALGORITHM_MIN_HOURS_TO_PRUNE_BY_AVG ?? '3'),

            // time greedy
            bestPickedFromEachStep: parseInt(process.env.ALGORITHM_GREEDY_STEP_PICK ?? '3'),

            // genetic
            generationSize: parseInt(process.env.ALGORITHM_GENETIC_GENERATION_SIZE ?? '25'),
            generations: parseInt(process.env.ALGORITHM_GENERATIONS ?? '2500'),
            bestPickedFromEachGeneration: parseInt(process.env.ALGORITHM_BEST_PICKED_FROM_EACH_GENERATION ?? '10'),
        };

        // init executors
        this.scheduleExecutors = new Map();
        this.scheduleExecutors.set(SCHEDULE_ALGORITHM.COURSE_GREEDY, CourseGreedyScheduleExecutorService.getInstance());
        this.scheduleExecutors.set(SCHEDULE_ALGORITHM.TIME_GREEDY, TimeGreedyScheduleExecutorService.getInstance());
        this.scheduleExecutors.set(SCHEDULE_ALGORITHM.GENETIC, GeneticScheduleExecutorService.getInstance());
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
        const startTimestamp = new Date();
        const scheduleParams: IScheduleParams = { targetHours, reduceDays, prioritizeUnlocks };

        // STEPS 1-4 - Get all information needed
        const inputData: IScheduleInputData = await this.dao.getScheduleInfo(universityId, programId, termId, studentId);

        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots TODO handle in db
        this.filterViableCourseClasses(inputData, unavailableTimeSlots);

        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        const maxAmountOfPossibleCombinations = this.getMaxAmountOfPossibleCombinations(inputData);

        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        // STEP 8 - Calculate stats for each valid schedule (done while combining courseClasses)
        // STEP 9 - Calculate score for each schedule (done while combining courseClasses)
        const deadline = new Date(Date.now() + this.algorithmParams.maxMsDeadlineToProcess);

        // algorithm selection
        const selectedExecutor = this.scheduleExecutors.get(this.algorithmParams.selectedAlgorithm)!;
        const schedules: IScheduleWithScore[] = selectedExecutor.getSchedules(this.algorithmParams, this.calculateScheduleScore, scheduleParams, inputData, deadline, DEBUG);

        // STEP 10 - Return sorted list of schedules by score
        const resp = schedules.sort((a, b) =>  b.score-a.score);
        let winners = resp.filter(i => i.score == resp[0].score).length         // Amount of tied winners
        winners = Math.min(this.algorithmParams.maxAmountToReturn, winners)     // Limit to MAX_AMOUNT_TO_RETURN
        const topResults = resp.slice(0, Math.max(amountToReturn, winners));    // Return as many as requested and then some in case of tie

        if(DEBUG && topResults.length > 0){
            console.log(`Finished executing ${selectedExecutor.getName()}`)
            console.log(`We had ${inputData.courseClasses.size} classes across ${inputData.courses.size} courses. That's ${maxAmountOfPossibleCombinations} possible combinations`);
            console.log(`Valid schedules avg score: ${schedules.map(i=>i.score).reduce((a, b) => a + b) / schedules.length}`);
            console.log(`Returned results avg score: ${topResults.map(i=>i.score).reduce((a, b) => a + b) / topResults.length}`);
            console.log(`Returning ${topResults.length} results with score ${topResults[0].score} - ${topResults[topResults.length-1].score}`);
            console.log(`Finished in ${(new Date().getTime()-startTimestamp.getTime())/1000} seconds.`);
        }

        return topResults;
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
    private filterViableCourseClasses(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[]): void {
        const viableCourseClasses: Map<string, CourseClass> = new Map();
        const ccIds = inputData.courseClasses.keys() ?? [];
            for(const ccId of ccIds) {
                const ccLectureIds = inputData.lecturesOfCourseClass.get(ccId) ?? [];
                const ccLectureTimes: TimeRange[] = [];
                for(const lectureId of ccLectureIds){
                    const l = inputData.lectures.get(lectureId);
                    if(l !== undefined) ccLectureTimes.push(l.time);
                }
                if(this.areTimeRangesCompatible(ccLectureTimes, unavailableTimeSlots))
                    viableCourseClasses.set(ccId, inputData.courseClasses.get(ccId)!);
            }
        inputData.courseClasses = viableCourseClasses;
    }

    // defines how score is calculated
    private calculateScheduleScore(scheduleMetrics: IScheduleMetrics, scheduleParams: IScheduleParams, algorithmParams: IAlgorithmParams): number {
        const p1 = 1 - (scheduleMetrics.optionalCourses / scheduleMetrics.totalCourses);
        const p2 = Math.abs(scheduleParams.targetHours - (scheduleMetrics.totalMinutes / 60));
        const p3 = 7 - scheduleMetrics.totalDays.size;
        const p4 = scheduleMetrics.totalImportance;
        const a = (scheduleParams.reduceDays)? 1:0;
        const b = (scheduleParams.prioritizeUnlocks)? 1:0;

        const m = algorithmParams.scoreMultipliers
        return m[0]*p1 - m[1]*p2 + a*m[2]*p3 + b*m[3]*p4;
    }

    private getMaxAmountOfPossibleCombinations(inputData: IScheduleInputData): number {
        let possibleCombos = 1;
        for(const c of inputData.courseClassesOfCourse.keys())
            possibleCombos *= (inputData.courseClassesOfCourse.get(c)!.length+1);

        return possibleCombos - 1; // Empty schedule is not an option
    }
}
