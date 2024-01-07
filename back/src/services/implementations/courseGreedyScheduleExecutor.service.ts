import { ERRORS } from "../../constants/error.constants";
import { SCHEDULE_ALGORITHM } from "../../constants/schedule.constants";
import { DAY } from "../../constants/time.constants";
import GenericException from "../../exceptions/generic.exception";
import { IAlgorithmParams, IScheduleInputData, IScheduleMetrics, IScheduleParams, IScheduleWithScore, ScoreMethod } from "../../interfaces/schedule.interface";
import ScheduleExecutorService from "../scheduleExecutor.service";

export default class CourseGreedyScheduleExecutorService extends ScheduleExecutorService {
    private static instance: CourseGreedyScheduleExecutorService;

    static getInstance(): CourseGreedyScheduleExecutorService {
        if (!CourseGreedyScheduleExecutorService.instance) {
            CourseGreedyScheduleExecutorService.instance = new CourseGreedyScheduleExecutorService(SCHEDULE_ALGORITHM.COURSE_GREEDY);
        }
        return CourseGreedyScheduleExecutorService.instance;
    }
    
    getSchedules(
        algorithmParams: IAlgorithmParams,
        scoreMethod: ScoreMethod,
        scheduleParams: IScheduleParams,
        inputData: IScheduleInputData,
        deadline?: Date | undefined,
        debug?: boolean | undefined
    ): IScheduleWithScore[] {
        const viableCourseClassesArray = this.getSortedCourseCourseClassesArray(inputData);
        if(algorithmParams.shuffleCourses){
            for (let i = viableCourseClassesArray.length-1; i > algorithmParams.fixedIndexesDuringShuffle; i--) {
                const j = algorithmParams.fixedIndexesDuringShuffle + Math.floor(Math.random() * (i + 1 - algorithmParams.fixedIndexesDuringShuffle*2));
                [viableCourseClassesArray[i], viableCourseClassesArray[j]] = [viableCourseClassesArray[j], viableCourseClassesArray[i]];
            }
        }

        let validSchedules: IScheduleWithScore[] = [];

        let processedCombos = 0;
        let index = 0;
        let averageScore = 0;
        while(index < viableCourseClassesArray.length && (!deadline || new Date() < deadline) && processedCombos < algorithmParams.maxSchedulesToProcess) {
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
                const totalDays: Set<DAY> = new Set();
                const courseId = inputData.courseOfCourseClass.get(cc.id);
                const lectures = inputData.lecturesOfCourseClass.get(cc.id);
                if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
    
                for(const lectureId of lectures){
                    const l = inputData.lectures.get(lectureId);
                    if (!l) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
                    totalDays.add(l.time.dayOfWeek);
                }
                const schedule = this.createSchedule([cc.id], inputData);
                const scheduleMetrics: IScheduleMetrics = {
                    totalMinutes: schedule.totalHours * 60,
                    totalDays,
                    optionalCourses: inputData.optionalCourseIds.has(cc.id)?1:0,
                    totalCourses: 1,
                    totalImportance: schedule.totalImportance,
                }
                const scheduleWithScore = {schedule: schedule, score: scoreMethod(scheduleMetrics, scheduleParams, algorithmParams), optionalCredits: courseOptionalCredits}
                newValidSchedules.push(scheduleWithScore);
            }

            for (let i=0; i < validSchedules.length; i++) {
                const baseSchedule = validSchedules[i].schedule;

                // Skip this course if this combo already exceeds the max amount of optional credits we can suggest
                if(courseOptionalCredits > 0 && baseSchedule.optionalCredits > inputData.remainingOptionalCredits)
                    continue;

                // If adding a class belonging to the current course to an existing combo is valid, push it to the array
                for (const cc of viableCourseClassesArray[index]) {
                    if((deadline && new Date() > deadline) || processedCombos > algorithmParams.maxSchedulesToProcess){
                        if (debug) console.log(`${algorithmParams.greedyPruning?'With':'Without'} pruning, processed ${processedCombos} schedules in total. ${validSchedules.length+newValidSchedules.length} of those were used.`);
                        return validSchedules.concat(newValidSchedules);
                    }

                    processedCombos++;
                    const weeklyHours = baseSchedule.totalHours + (inputData.weeklyClassTimeInMinutes.get(cc.id)?? 0)/60;
                    const baseCombo = baseSchedule.courseClasses.map(cc => cc.id);
                    const combo = [cc.id, ...baseCombo]

                    if(weeklyHours <= scheduleParams.targetHours*algorithmParams.targetHourExceedRateLimit && this.isClassCombinationValid(baseCombo, cc.id, inputData.incompatibilityCache)){
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
                        if(
                            !algorithmParams.greedyPruning ||
                            score >= averageScore ||
                            weeklyHours <= Math.min(scheduleParams.targetHours/2, algorithmParams.minHoursToPruneByAvg) ||
                            validSchedules.length <= algorithmParams.minAmountOfSchedulesToPruneByAvg ||
                            index < algorithmParams.minAmountOfProcessedCoursesToPruneByAvg
                        ){
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
        if(debug) console.log(`\n[${this.getName()}] ${algorithmParams.greedyPruning?'With':'Without'} pruning, processed ${processedCombos} schedules in total. ${validSchedules.length} of those were used.`);
        return validSchedules;
    }
}