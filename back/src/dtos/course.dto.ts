import Course from '../models/abstract/course.model';
import { getUserUrl } from './user.dto';
import { ROLE } from '../constants/general.constants';

export const courseToDto = (course: Course, universityId: string): ICourseDto => {
    return {
        id: course.id,
        url: getCourseUrl(course.id),
        name: course.name,
        code: course.internalId,
        requirements: getCourseRequirementsUrl(course.id),
        universityId: universityId,
        universityUrl: getUserUrl(universityId, ROLE.UNIVERSITY),
    };
};

export const getCourseUrl = (courseId: string): string => {
    return `course/${courseId}`;
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
