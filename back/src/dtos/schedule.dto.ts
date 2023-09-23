import { ISchedule } from '../interfaces/schedule.interface';
import { getResourceUrl } from '../helpers/url.helper';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';

export const scheduleToDto = (schedule: ISchedule, score: number): IScheduleDto => {
    const courseClassDtos = schedule.courseClasses.map(cc => {
        return {courseClassId: cc.id, courseClassUrl: getResourceUrl(RESOURCES.COURSE_CLASS, API_SCOPE.STUDENT, cc.id)}
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
