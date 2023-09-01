import Time from '../helpers/classes/time.class';
import CourseClass from '../models/abstract/courseClass.model';

export interface ISchedule {
    courseClasses: CourseClass[];
    totalHours: number;
    totalDays: number;
    totalImportance: number;
    mandatoryRate: number;
    earliestLecture: Time;
    latestLecture: Time;
}
