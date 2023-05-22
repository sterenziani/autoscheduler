import Course from '../models/abstract/course.model';
import University from '../models/abstract/university.model';
import { getUserUrl } from './user.dto';
import { ROLE } from '../constants/general.constants';

export const courseToDto = (course: Course, university: University): ICourseDto => {
    return {
        id: course.id,
        url: getCourseUrl(course.id),
        name: course.name,
        code: course.internalId,
        requirements: getCourseRequirementsUrl(course.id),
        universityId: university.id,
        universityUrl: getUserUrl(university.id, ROLE.UNIVERSITY),
    };
};

export const getCourseUrl = (courseId: string): string => {
    return `api/course/${courseId}`;
};

export const getCourseRequirementsUrl = (courseId: string): string => {
    return `${getCourseUrl(courseId)}/requirements`;
};

interface ICourseDto {
    id: string;
    url: string;
    name: string;
    code: string;
    requirements: string;
    universityId: string;
    universityUrl: string;
}
