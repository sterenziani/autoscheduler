import { ISchedule } from '../interfaces/schedule.interface';
import Time from '../helpers/classes/time.class';
import CourseClass from '../models/abstract/courseClass.model';
import * as CourseClassDto from './courseClass.dto';

export const scheduleToDto = (schedule: ISchedule, score: number): IScheduleDto => {
    const courseClassDtos = schedule.courseClasses.map(cc => {
        return {courseClassId: cc.id, courseClassUrl: CourseClassDto.getCourseClassUrl(cc.id)}
    });
    const stats = {
        totalHours: schedule.totalHours,
        totalDays: schedule.totalDays,
        earliestLecture: schedule.earliestLecture.toString(),
        latestLecture: schedule.latestLecture.toString(),
    }

    return {
        courseClasses: courseClassDtos,
        stats: stats,
        score: score
    };
};

type IScheduleDto = {
    courseClasses: ICourseClassDto[];
    stats: IScheduleStatsDto;
    score: number;
};

interface ICourseClassDto {
    courseClassId: string;
    courseClassUrl: string;
}

interface IScheduleStatsDto {
    totalHours: number;
    totalDays: number;
    earliestLecture: string;
    latestLecture: string;
}
