import Course from '../models/abstract/course.model';
import { getUserUrl } from './user.dto';
import { getProgramUrl } from './program.dto';
import { ROLE } from '../constants/general.constants';
import { queryParamsStringBuilder } from '../helpers/url.helper';

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

interface ICourseDto {
    id: string;
    url: string;
    name: string;
    code: string;
    requirements: string;
    universityId: string;
    universityUrl: string;
}

interface IRequirementsForProgramDto {
    programId: string;
    programUrl: string;
    programRequirementsUrl: string;
}
