import CourseClass from '../models/abstract/courseClass.model';
import * as BuildingDto from './building.dto';
import * as CourseDto from './course.dto';
import * as TermDto from './term.dto';
import Lecture from '../models/abstract/lecture.model';
import { DAY } from '../constants/time.constants';

export const courseClassToDto = (courseClass: CourseClass, courseId: string, termId: string): ICourseClassDto => {
    return {
        id: courseClass.id,
        url: getCourseClassUrl(courseClass.id),
        name: courseClass.name,
        courseId: courseId,
        courseUrl: CourseDto.getCourseUrl(courseId),
        termId: termId,
        termUrl: TermDto.getTermUrl(termId),
        lecturesUrl: getLecturesUrl(courseClass.id),
    };
};

export const lectureToDto = (lecture: Lecture, buildingId: string|undefined): ILectureDto => {
    if(!buildingId)
        return {
            day: lecture.time.dayOfWeek,
            startTime: lecture.time.startTime.toString(),
            endTime: lecture.time.endTime.toString(),
        };
    return {
        day: lecture.time.dayOfWeek,
        startTime: lecture.time.startTime.toString(),
        endTime: lecture.time.endTime.toString(),
        buildingId: buildingId,
        buildingUrl: BuildingDto.getBuildingUrl(buildingId),
    };
};

export const getCourseClassUrl = (courseClassId: string): string => {
    return `course-class/${courseClassId}`;
};

export const getLecturesUrl = (courseClassId: string): string => {
    return `course-class/${courseClassId}/lectures`;
};

interface ICourseClassDto {
    id: string;
    url: string;
    name: string;
    courseId: string;
    courseUrl: string;
    termId: string;
    termUrl: string;
    lecturesUrl: string;
}

interface ILectureDto {
    day: DAY;
    startTime: string;
    endTime: string;
    buildingId?: string;
    buildingUrl?: string;
}
