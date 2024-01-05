import { ERRORS } from "../constants/error.constants";
import GenericException from "../exceptions/generic.exception";
import Time from "../helpers/classes/time.class";
import { IAlgorithmParams, ISchedule, IScheduleInputData, IScheduleParams, IScheduleWithScore, ScoreMethod } from "../interfaces/schedule.interface";
import CourseClass from "../models/abstract/courseClass.model";

export default abstract class ScheduleExecutorService {
    protected algorithmName: string;

    constructor(algorithmName: string) {
        this.algorithmName = algorithmName;
    }

    // getter
    public getName(): string {
        return this.algorithmName;
    }

    // calculates the Schedule based on provided data
    abstract getSchedules(
        algorithmParams: IAlgorithmParams,
        scoreMethod: ScoreMethod,
        params: IScheduleParams,
        inputData: IScheduleInputData,
        deadline?: Date,
        debug?: boolean
        ): IScheduleWithScore[];

    // aux methods

    protected createSchedule(courseClassIds: string[], inputData: IScheduleInputData): ISchedule {
        let totalMinutes = 0;
        const totalDays = new Set();
        let totalImportance = 0;
        let amountOfMandatoryCourses = 0;
        let optionalCredits = 0;
        let earliestLecture = Time.maxValue();
        let latestLecture = Time.minValue();

        for(const ccId of courseClassIds) {
            const courseId = inputData.courseOfCourseClass.get(ccId);
            const lectures = inputData.lecturesOfCourseClass.get(ccId);
            if(!courseId || !lectures) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);

            const classImportance = inputData.indirectCorrelativesAmount.get(courseId);
            if(classImportance === undefined) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.GENERAL);
            totalImportance += classImportance;
            totalMinutes += inputData.weeklyClassTimeInMinutes.get(ccId)?? 0;

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
            courseClasses: courseClassIds.map(ccId => inputData.courseClasses.get(ccId)).filter(cc => cc !== undefined) as CourseClass[],
            totalHours: totalMinutes/60,
            totalDays: totalDays.size,
            totalImportance,
            mandatoryRate: amountOfMandatoryCourses / courseClassIds.length,
            earliestLecture,
            latestLecture,
            optionalCredits,
        }
    }

    // Checks for lecture overlaps and building distances
    protected isClassCombinationValid(courseClassIds: string[], ccIdToAdd: string, cache: Map<string, Set<string>>): boolean {
        for(const courseClassId of courseClassIds){
            const ccId1 = courseClassId;
            const ccId2 = ccIdToAdd;
            if(cache.get(ccId1)?.has(ccId2) || cache.get(ccId2)?.has(ccId1))
                return false;
        }
        return true;
    }

    // Returns matrix where each array contains classes belonging to a course, example:
    // resp = [ [A1, A2], [B1, B2], [C1] ]
    // Returned groups of classes will be sorted by their course's correlatives in increasing order
    protected getSortedCourseCourseClassesArray(inputData: IScheduleInputData): CourseClass[][] {
        const viableCourseClassesMap: Map<string, string[]> = this.getCourseCourseClassesMap(inputData);
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
        }
        return viableCourseClassesArray;
    }

    // Returns map of courseClasses that don't overlap unavailableTimeSlots TODO once viable is handled in db it should have less logic 
    private getCourseCourseClassesMap(inputData: IScheduleInputData): Map<string, string[]> {
        const courseClassesMap: Map<string, string[]> = new Map<string, string[]>();
        for(const courseId of inputData.courses.keys()) {
            courseClassesMap.set(courseId, []);
            const ccIds = inputData.courseClassesOfCourse.get(courseId) ?? [];
            for(const ccId of ccIds) {
                if (inputData.courseClasses.has(ccId)) courseClassesMap.get(courseId)?.push(ccId);
            }
        }
        return courseClassesMap;
    }
}