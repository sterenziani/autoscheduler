import { ERRORS } from "../../constants/error.constants";
import { SCHEDULE_ALGORITHM } from "../../constants/schedule.constants";
import { DAY } from "../../constants/time.constants";
import GenericException from "../../exceptions/generic.exception";
import { IAlgorithmParams, IGeneticIndexCombinationWithScore, IScheduleInputData, IScheduleMetrics, IScheduleParams, IScheduleWithScore, ScoreMethod } from "../../interfaces/schedule.interface";
import CourseClass from "../../models/abstract/courseClass.model";
import ScheduleExecutorService from "../scheduleExecutor.service";

export default class GeneticScheduleExecutorService extends ScheduleExecutorService {
    private static instance: GeneticScheduleExecutorService;

    static getInstance(): GeneticScheduleExecutorService {
        if (!GeneticScheduleExecutorService.instance) {
            GeneticScheduleExecutorService.instance = new GeneticScheduleExecutorService(SCHEDULE_ALGORITHM.GENETIC);
        }
        return GeneticScheduleExecutorService.instance;
    }
    
    getSchedules(
        algorithmParams: IAlgorithmParams,
        scoreMethod: ScoreMethod,
        scheduleParams: IScheduleParams,
        inputData: IScheduleInputData,
        deadline?: Date | undefined,
        debug?: boolean | undefined
        ): IScheduleWithScore[] {
            const startTimestamp = new Date();
            const viableCourseClassesArray = this.getSortedCourseCourseClassesArray(inputData);
    
            const bestCombos:Set<string> = new Set();
            const bestSchedules: IGeneticIndexCombinationWithScore[] = [];
    
            let processedCombos = 0;
            let population: IGeneticIndexCombinationWithScore[] = [];
    
            // GENERATE GEN 1
            for(let i=0; i < algorithmParams.generationSize && (!deadline || new Date() < deadline) && processedCombos < algorithmParams.maxSchedulesToProcess; i++){
                const ccArray = this.createRandomCourseClassCombination(viableCourseClassesArray);
                const s = this.buildRandomCourseClassCombinationSchedule(ccArray, inputData, viableCourseClassesArray, scheduleParams, scoreMethod, algorithmParams);
                population.push(s);
                processedCombos++;
            }
            this.updateBestSchedules(population, bestCombos, bestSchedules, algorithmParams);
    
            let gen = 2;
            while(gen <= algorithmParams.generations){
                const newGen: IGeneticIndexCombinationWithScore[] = [];
                for(let x=0; x < algorithmParams.generationSize/2 && (!deadline || new Date() < deadline) && processedCombos < algorithmParams.maxSchedulesToProcess; x++){
                    // Pick our parents using Tournament
                    let parentIndex1 = 0;
                    let parentIndex2 = 0;
                    for(let i=0; i < population.length; i++) {
                        const currentScheduleScore = population[i].score;
                        // If picked as a candidate parent, save best candidate so far
                        if(Math.random() <= 0.5 && population[parentIndex1].score <= currentScheduleScore)
                            parentIndex1 = i;
                        // If not picked as parent1, see if picked as parent2
                        else if(Math.random() <= 0.5 && population[parentIndex2].score <= currentScheduleScore)
                            parentIndex2 = i;
                    }
                    const [ccArray1, ccArray2] = this.breed(population[parentIndex1].combo, population[parentIndex2].combo, viableCourseClassesArray);
                    processedCombos += 2;
    
                    const s1 = this.buildRandomCourseClassCombinationSchedule(ccArray1, inputData, viableCourseClassesArray, scheduleParams, scoreMethod, algorithmParams);
                    newGen.push(s1);
    
                    const s2 = this.buildRandomCourseClassCombinationSchedule(ccArray2, inputData, viableCourseClassesArray, scheduleParams, scoreMethod, algorithmParams);
                    newGen.push(s2);
                }
    
                population = newGen;
                this.updateBestSchedules(population, bestCombos, bestSchedules, algorithmParams);
                gen++;
            }
    
            const schedules: IScheduleWithScore[] = bestSchedules
                .filter(s => s.score > Number.MIN_VALUE)
                .map(s => {return {
                    schedule: (s.schedule?? this.createSchedule([], inputData)),
                    score: s.score
                }});
    
            if(debug) console.log(`\n[${this.getName()}] Finished in ${((new Date().getTime()-startTimestamp.getTime())/1000)} seconds, processed ${processedCombos} combinations`);
            return schedules;
    }

    // AUX methods

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

    private buildRandomCourseClassCombinationSchedule(ccArray: number[], inputData: IScheduleInputData, viableCourseClassesArray: CourseClass[][], scheduleParams: IScheduleParams, scoreMethod: ScoreMethod, algorithmParams: IAlgorithmParams): IGeneticIndexCombinationWithScore{
        if(this.isRandomClassCombinationValid(ccArray, viableCourseClassesArray, inputData.incompatibilityCache)){
            const combo: string[] = [];
            for(let c = 0; c < ccArray.length; c++){
                if(ccArray[c] < viableCourseClassesArray[c].length){
                    combo.push(viableCourseClassesArray[c][ccArray[c]].id);
                }
            }
            const totalDays: Set<DAY> = new Set();
            for(const ccId of combo) {
                const courseId = inputData.courseOfCourseClass.get(ccId);
                const lectures = inputData.lecturesOfCourseClass.get(ccId);
                if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
    
                for(const lectureId of lectures){
                    const l = inputData.lectures.get(lectureId);
                    if (!l) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                    totalDays.add(l.time.dayOfWeek);
                }
            }
            const schedule = this.createSchedule(combo, inputData);
            const scheduleMetrics: IScheduleMetrics = {
                totalMinutes: schedule.totalHours * 60,
                totalDays,
                optionalCourses: (1-schedule.mandatoryRate) * combo.length,
                totalCourses: combo.length,
                totalImportance: schedule.totalImportance
            }
            const score = scoreMethod(scheduleMetrics, scheduleParams, algorithmParams);
            return {schedule: schedule, combo: ccArray, score: score};
        }
        return {schedule: undefined, combo: ccArray, score: Number.MIN_VALUE}
    }

    private updateBestSchedules(population: IGeneticIndexCombinationWithScore[], bestCombos: Set<string>, bestSchedules: IGeneticIndexCombinationWithScore[], algorithmParams: IAlgorithmParams) {
        population.sort((a, b) =>  b.score-a.score).slice(0, algorithmParams.bestPickedFromEachGeneration).forEach(item => {
            if(!bestCombos.has(item.combo.toString())){
                bestCombos.add(item.combo.toString());
                bestSchedules.push(item);
            }
        });
    }

    private breed(x: number[], y: number[], viableCourseClassesArray: CourseClass[][]): number[][] {
        const a = [...x]
        const b = [...y]
        for(let c=0; c < a.length; c++){
            // If selected, swap
            if(Math.random() < 0.5)
                [a[c], b[c]] = [b[c], a[c]];

            // Small chance of mutating class
            if(Math.random() < 0.1)
                a[c] = Math.floor(Math.random() * (viableCourseClassesArray[c].length+1))
            if(Math.random() < 0.1)
                b[c] = Math.floor(Math.random() * (viableCourseClassesArray[c].length+1))
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
}