import Course from '../models/abstract/course.model';
import { getUserUrl } from './user.dto';
import { getProgramUrl } from './program.dto';
import { ROLE } from '../constants/general.constants';

export const courseToDto = (course: Course, universityId: string): ICourseDto => {
    return {
        id: course.id,
        url: getCourseUrl(course.id),
        name: course.name,
        code: course.internalId,
        requirements: getCourseRequirementsUrl(course.id),
        courseClasses: getCourseCourseClassesUrl(course.id),
        universityId: universityId,
        universityUrl: getUserUrl(universityId, ROLE.UNIVERSITY),
    };
};

export const programToRequirementsForProgramDto = (course: Course, programId: string): IRequirementsForProgramDto => {
    return {
        programId: programId,
        programUrl: getProgramUrl(programId),
        programRequirementsUrl: getCourseRequirementsForProgramUrl(course.id, programId),
    };
};

export const getCourseUrl = (courseId: string): string => {
    return `course/${courseId}`;
};

export const getCourseRequirementsUrl = (courseId: string): string => {
    return `${getCourseUrl(courseId)}/requirements`;
};

export const getCourseRequirementsForProgramUrl = (courseId: string, programId: string): string => {
    return `${getCourseRequirementsUrl(courseId)}/${programId}`;
};

export const getCourseCourseClassesUrl = (
    courseId: string,
    termId?: string,
    filter?: string,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        termId,
        filter,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return `${getCourseUrl(courseId)}/course-classes`;
};

interface ICourseDto {
    id: string;
    url: string;
    name: string;
    code: string;
    requirements: string;
    courseClasses: string;
    universityId: string;
    universityUrl: string;
}

interface IRequirementsForProgramDto {
    programId: string;
    programUrl: string;
    programRequirementsUrl: string;
}
