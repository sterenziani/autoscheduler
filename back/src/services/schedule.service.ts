import { IScheduleInputData } from '../interfaces/schedule.interface';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import ScheduleDao from '../persistence/abstract/schedule.dao';
import ScheduleDaoFactory from '../factories/scheduleDao.factory';
import StudentService from './student.service';
import ProgramService from './program.service';
import TermService from './term.service';
import CourseClass from '../models/abstract/courseClass.model';
import {ISchedule, IScheduleWithScore, IAlgorithmParams} from '../interfaces/schedule.interface';
import Time from '../helpers/classes/time.class';
import TimeRange from '../helpers/classes/timeRange.class';
import { DEFAULT_DISTANCE } from '../constants/schedule.constants';

const DEBUG = true;
const GENETIC_GENERATION_SIZE = 25000;

export default class ScheduleService {
    private static instance: ScheduleService;
    private dao: ScheduleDao;

    private studentService!: StudentService;
    private programService!: ProgramService;
    private termService!: TermService;
    private algorithmParams!: IAlgorithmParams;

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
        this.algorithmParams = {
            targetHourExceedRateLimit: parseFloat(process.env.ALGORITHM_TARGET_HOUR_EXCEED_RATE_LIMIT?? '1.25'),
            shuffleCourses: (process.env.ALGORITHM_SHUFFLE_COURSES=='true'),
            fixedIndexesDuringShuffle: parseInt(process.env.ALGORITHM_SHUFFLE_FIXED_INDEXES?? '3'),
            maxSchedulesToProcess: parseInt(process.env.ALGORITHM_MAX_SCHEDULES_TO_PROCESS?? '500000'),
            maxMsDeadlineToProcess: parseFloat(process.env.ALGORITHM_MAX_MS_DEADLINE_TO_PROCESS?? '2000'),

            greedyPruning: (process.env.ALGORITHM_GREEDY_PRUNING=='true'),
            minAmountOfSchedulesToPruneByAvg: parseInt(process.env.ALGORITHM_MIN_AMOUNT_OF_SCHEDULES_TO_PRUNE_BY_AVG?? '25'),
            minAmountOfProcessedCoursesToPruneByAvg: parseInt(process.env.ALGORITHM_MIN_AMOUNT_OF_PROCESSED_COURSES_TO_PRUNE_BY_AVG?? '3'),
            minHoursToPruneByAvg: parseFloat(process.env.ALGORITHM_MIN_HOURS_TO_PRUNE_BY_AVG?? '10'),

            maxAmountToReturn: parseInt(process.env.ALGORITHM_MAX_AMOUNT_TO_RETURN?? '25')
        };
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
    ): Promise<IScheduleWithScore[]> {
        const startTimestamp = new Date();

        // STEPS 1-4 - Get all information needed
        const inputData: IScheduleInputData = await this.dao.getScheduleInfo(universityId, programId, termId, studentId);

        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots (done inside getCourseClassCombinations)
        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        // STEP 8 - Calculate stats for each valid schedule (done while combining courseClasses)
        // STEP 9 - Calculate score for each schedule (done while combining courseClasses)
        const deadline = new Date(Date.now() + this.algorithmParams.maxMsDeadlineToProcess);
        const schedules = this.getCourseClassCombinationsGenetic(inputData, unavailableTimeSlots, targetHours, reduceDays, prioritizeUnlocks, deadline);

        // STEP 10 - Return sorted list of schedules by score
        const resp = schedules.sort((a, b) =>  b.score-a.score);
        let winners = resp.filter(i => i.score == resp[0].score).length         // Amount of tied winners
        winners = Math.min(this.algorithmParams.maxAmountToReturn, winners)     // Limit to MAX_AMOUNT_TO_RETURN
        const topResults = resp.slice(0, Math.max(amountToReturn, winners));    // Return as many as requested and then some in case of tie

        if(DEBUG){
            console.log("Valid schedules avg score: " +(schedules.map(i=>i.score).reduce((a, b) => a + b) / schedules.length));
            console.log("Returned results avg score: " +(topResults.map(i=>i.score).reduce((a, b) => a + b) / topResults.length));
            console.log("Finished in " +((new Date().getTime()-startTimestamp.getTime())/1000)  +" seconds.");
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
        const viableCourseIds: string[] = [...inputData.mandatoryCourseIds].concat([...inputData.optionalCourseIds]);

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
    private getCourseClassCombinations(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[], targetHours: number, reduceDays: boolean, prioritizeUnlocks: boolean, deadline: Date): IScheduleWithScore[] {
        const viableCourseClassesArray = this.getSortedViableCourseClassesArray(inputData, unavailableTimeSlots);
        if(this.algorithmParams.shuffleCourses){
            for (let i = viableCourseClassesArray.length-1; i > this.algorithmParams.fixedIndexesDuringShuffle; i--) {
                const j = this.algorithmParams.fixedIndexesDuringShuffle + Math.floor(Math.random() * (i + 1 - this.algorithmParams.fixedIndexesDuringShuffle*2));
                [viableCourseClassesArray[i], viableCourseClassesArray[j]] = [viableCourseClassesArray[j], viableCourseClassesArray[i]];
            }
        }

        let validSchedules: IScheduleWithScore[] = [];

        let processedCombos = 0;
        let index = 0;
        let averageScore = 0;
        const startLoop = new Date().getTime();
        while(index < viableCourseClassesArray.length && new Date() < deadline && processedCombos < this.algorithmParams.maxSchedulesToProcess) {
            // Update averageScore before this course
            if(validSchedules.length > 0)
                averageScore = validSchedules.map(i=>i.score).reduce((a, b) => a + b) / validSchedules.length;

            // Calculate this course's impact on proposed combinations' optionalCourseCredits
            const courseId = inputData.courseOfCourseClass.get(viableCourseClassesArray[index][0].id);
            if(!courseId) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            const course = inputData.courses.get(courseId);
            if(!course) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            const courseOptionalCredits = inputData.optionalCourseIds.has(courseId)? course.creditValue : 0;

            //if(DEBUG) console.log("\t" +((new Date().getTime()-startLoop)/1000) +" secs into loop, have processed " +processedCombos +" combinations so far. Now considering combinations that include " +course.name +". Imporance: " +inputData.indirectCorrelativesAmount.get(course.id));

            const newValidSchedules: IScheduleWithScore[] = [];

            // Schedules that only contain a class of our current course are a possibility
            for(const cc of viableCourseClassesArray[index]){
                processedCombos++;
                const schedule = this.createSchedule([cc], inputData);
                const scheduleWithScore = {schedule: schedule, score: this.calculateScheduleScore(schedule, targetHours, reduceDays, prioritizeUnlocks), optionalCredits: courseOptionalCredits}
                newValidSchedules.push(scheduleWithScore);
            }

            for (let i=0; i < validSchedules.length; i++) {
                const baseSchedule = validSchedules[i].schedule;

                // Skip this course if this combo already exceeds the max amount of optional credits we can suggest
                if(courseOptionalCredits > 0 && baseSchedule.optionalCredits > inputData.remainingOptionalCredits)
                    continue;

                // If adding a class belonging to the current course to an existing combo is valid, push it to the array
                for (const cc of viableCourseClassesArray[index]) {
                    if(new Date() > deadline || processedCombos > this.algorithmParams.maxSchedulesToProcess){
                        if(DEBUG) console.log((this.algorithmParams.greedyPruning?"With":"Without") +" pruning, processed " +processedCombos +" schedules in total. " +(validSchedules.length+newValidSchedules.length) +" of those were used.")
                        return validSchedules.concat(newValidSchedules);
                    }

                    processedCombos++;
                    const weeklyHours = baseSchedule.totalHours + (inputData.weeklyClassTimeInMinutes.get(cc.id)?? 0)/60;
                    const combo = baseSchedule.courseClasses

                    if(weeklyHours <= targetHours*this.algorithmParams.targetHourExceedRateLimit && this.isClassCombinationValid(combo, cc.id, inputData.incompatibilityCache)){
                        const schedule = this.createSchedule([cc, ...combo], inputData);
                        const score = this.calculateScheduleScore(schedule, targetHours, reduceDays, prioritizeUnlocks);
                        if(!this.algorithmParams.greedyPruning || score >= averageScore || weeklyHours <= Math.min(targetHours/2, this.algorithmParams.minHoursToPruneByAvg) ||  validSchedules.length <= this.algorithmParams.minAmountOfSchedulesToPruneByAvg || index < this.algorithmParams.minAmountOfProcessedCoursesToPruneByAvg){
                            newValidSchedules.push({schedule: schedule, score: score});
                        }
                    }
                }
            }

            // Add all new combinations that contain the current course to validShedules
            // This is done outside the loop to avoid growing validSchedules and iterating forever
            validSchedules = validSchedules.concat(newValidSchedules);
            index += 1;
        }
        if(DEBUG) console.log((this.algorithmParams.greedyPruning?"With":"Without") +" pruning, processed " +processedCombos +" schedules in total. " +validSchedules.length +" of those were used.")
        return validSchedules;
    }

    private getCourseClassCombinationsGenetic(inputData: IScheduleInputData, unavailableTimeSlots: TimeRange[], targetHours: number, reduceDays: boolean, prioritizeUnlocks: boolean, deadline: Date): IScheduleWithScore[] {
        let processedCombos = 0;
        const startTimestamp = new Date();
        const viableCourseClassesArray = this.getSortedViableCourseClassesArray(inputData, unavailableTimeSlots);

        let gen1: number[][] = []
        let scores: number[] = []

        // GENERATE GEN 1
        console.log("Gen 1")
        for(let i=0; i < GENETIC_GENERATION_SIZE/2; i++){
            const ccArray = this.createRandomCourseClassCombination(viableCourseClassesArray);
            const s = this.buildRandomCourseClassCombinationSchedule(ccArray, inputData, viableCourseClassesArray, targetHours, reduceDays, prioritizeUnlocks);
            gen1.push(ccArray);
            scores.push(s.score);
            processedCombos++;
        }
        this.normalize(scores)


        // BREED GEN 2
        console.log("Gen 2")
        let gen2: number[][] = []
        let newScores = []
        for(let x=0; x < GENETIC_GENERATION_SIZE; x++){
            // Pick our parents using Tournament
            let parentIndex1 = 0
            let parentIndex2 = 0
            for(let i=0; i < scores.length; i++) {
                // See if picked as parent1. If picked as a candidate, save best candidate so far
                if(Math.random() < scores[i] && scores[parentIndex1] <= scores[i])
                    parentIndex1 = i
                // If not picked as parent1, see if picked as parent2
                else if(Math.random() < scores[i] && scores[parentIndex2] <= scores[i])
                    parentIndex2 = i
            }

            const [ccArray1, ccArray2] = this.breed(gen1[parentIndex1], gen1[parentIndex2], viableCourseClassesArray);
            const s1 = this.buildRandomCourseClassCombinationSchedule(ccArray1, inputData, viableCourseClassesArray, targetHours, reduceDays, prioritizeUnlocks);
            gen2.push(ccArray1);
            newScores.push(s1.score);
            processedCombos++;

            const s2 = this.buildRandomCourseClassCombinationSchedule(ccArray1, inputData, viableCourseClassesArray, targetHours, reduceDays, prioritizeUnlocks);
            gen2.push(ccArray2);
            newScores.push(s2.score);
            processedCombos++;
        }
        gen1 = gen2;
        scores = newScores;
        gen2 = [];
        newScores = []
        this.normalize(scores);

        const schedules: IScheduleWithScore[] = []
        console.log("Finished in " +((new Date().getTime()-startTimestamp.getTime())/1000)  +" seconds, processed " +processedCombos +" combos");
        console.log("Preparing schedules")
        for(let i=0; i < scores.length; i++){
            if(scores[i] > 0){
                const s = this.buildRandomCourseClassCombinationSchedule(gen1[i], inputData, viableCourseClassesArray, targetHours, reduceDays, prioritizeUnlocks);
                schedules.push(s)
            }
        }
        return schedules
    }

    private normalize(arr: number[]) {
        const min = Math.min(...arr)
        const max = Math.max(...arr)
        for(let i=0; i < arr.length; i++){
            if(arr[i] == Number.MIN_VALUE)
                arr[i] = 0;
            else
                arr[i] = (arr[i] - min) / (max - min);
        }
    }

    private breed(x: number[], y: number[], viableCourseClassesArray: CourseClass[][]): number[][] {
        const a = [...x]
        const b = [...y]
        for(let c=0; c < a.length; c++){
            // If selected, swap
            if(Math.random() < 0.5)
                [a[c], b[c]] = [b[c], a[c]];

            // Small chance of mutating class
            if(Math.random() < 0.05)
                a[c] = Math.floor(Math.random() * (viableCourseClassesArray[c].length*2))
            if(Math.random() < 0.05)
                b[c] = Math.floor(Math.random() * (viableCourseClassesArray[c].length*2))
        }
        return [a, b]
    }

    private createRandomCourseClassCombination(viableCourseClassesArray: CourseClass[][]): number[] {
        const ccSelection: number[] = [];
        for(let i=0; i < viableCourseClassesArray.length; i++){
            const j = Math.floor(Math.random() * (viableCourseClassesArray[i].length + 1));
            ccSelection.push(j);
        }
        return ccSelection;
    }

    private buildRandomCourseClassCombinationSchedule(ccArray: number[], inputData: IScheduleInputData, viableCourseClassesArray: CourseClass[][], targetHours: number, reduceDays: boolean, prioritizeUnlocks: boolean): IScheduleWithScore{
        if(this.isRandomClassCombinationValid(ccArray, viableCourseClassesArray, inputData.incompatibilityCache)){
            const combo: CourseClass[] = []
            for(let c = 0; c < ccArray.length-1; c++){
                if(ccArray[c] < viableCourseClassesArray[c].length)
                    combo.push(viableCourseClassesArray[c][ccArray[c]])
            }
            const schedule = this.createSchedule(combo, inputData)
            const score = this.calculateScheduleScore(schedule, targetHours, reduceDays, prioritizeUnlocks)
            return {schedule, score}
        }
        return {schedule: this.createSchedule([], inputData), score: Number.MIN_VALUE}
    }

    private isRandomClassCombinationValid(ccArray: number[], viableCourseClassesArray: CourseClass[][],  cache: Map<string, Set<string>>): boolean {
        for(let c1 = 0; c1 < ccArray.length-1; c1++){
            for(let c2 = c1; c2 < ccArray.length; c2++){
                // If one of the courseClasses is blank, there's no problem
                const ccIdx1 = ccArray[c1];
                const ccIdx2 = ccArray[c2];
                if(ccIdx1 >= viableCourseClassesArray[c1].length || ccIdx2 >= viableCourseClassesArray[c2].length)
                    continue;

                // If cache says the CCs are incompatible, return false
                const ccId1 = viableCourseClassesArray[c1][ccIdx1].id;
                const ccId2 = viableCourseClassesArray[c2][ccIdx2].id;
                if(cache.get(ccId1)?.has(ccId2) || cache.get(ccId2)?.has(ccId1))
                    return false;
            }
        }
        return true;
    }

    private isClassCombinationValid(courseClasses: CourseClass[], ccIdToAdd: string, cache: Map<string, Set<string>>): boolean {
        for(const cc1 of courseClasses){
            let ccId1 = cc1.id;
            let ccId2 = ccIdToAdd;
            if(cache.get(ccId1)?.has(ccId2) || cache.get(ccId2)?.has(ccId1))
                return false;
        }
        return true;
    }

    private createSchedule(courseClasses: CourseClass[], inputData: IScheduleInputData): ISchedule {
        let totalMinutes = 0;
        let totalDays = new Set();
        let totalImportance = 0;
        let amountOfMandatoryCourses = 0;
        let optionalCredits = 0;
        let earliestLecture = Time.maxValue();
        let latestLecture = Time.minValue();

        for(const cc of courseClasses) {
            const courseId = inputData.courseOfCourseClass.get(cc.id);
            const lectures = inputData.lecturesOfCourseClass.get(cc.id);
            if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

            const classImportance = inputData.indirectCorrelativesAmount.get(courseId);
            if(classImportance === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalImportance += classImportance;
            totalMinutes += inputData.weeklyClassTimeInMinutes.get(cc.id)?? 0;

            const course = inputData.courses.get(courseId);
            if(!course) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

            if(inputData.mandatoryCourseIds.has(courseId))
                amountOfMandatoryCourses++;
            else
                optionalCredits += course.creditValue;

            for(const lectureId of lectures){
                const l = inputData.lectures.get(lectureId);
                if (!l) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
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
            optionalCredits: optionalCredits,
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
