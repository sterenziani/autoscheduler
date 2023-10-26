import Course from '../models/abstract/course.model';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { IProgramRequiredCredits } from '../interfaces/course.interface';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { booleanToString } from '../helpers/string.helper';

export const courseToDto = (course: Course, scope: API_SCOPE): ICourseDto => {
    const url = getResourceUrl(RESOURCES.COURSE, scope, course.id);
    return {
        id: course.id,
        internalId: course.internalId,
        name: course.name,
        creditValue: course.creditValue,
        url,
        courseClassesUrl: applyPathToBase(url, 'course-classes'),
        requiredCoursesUrl: applyPathToBase(url, 'required-courses'),
        requiredCreditsUrl: applyPathToBase(url, 'required-credits')
    };
};

export const paginatedCoursesToDto = (paginatedCourses: PaginatedCollection<Course>, scope: API_SCOPE): ICourseDto[] => {
    return paginatedCourses.collection.map(t => courseToDto(t, scope));
};

export const paginatedCoursesToLinks = (paginatedCourses: PaginatedCollection<Course>, basePath: string, limit: number, filter?: string, optional?: boolean, programId?: string, universityId?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedCourses, paginatedCoursesUrlBuilder, basePath, limit, filter, optional, programId, universityId);
};

const paginatedCoursesUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, optional?: boolean, programId?: string, universityId?: string): string => {
    const params = {
        page,
        limit,
        filter,
        optional: booleanToString(optional),
        programId,
        universityId
    };
    return queryParamsStringBuilder(basePath, params);
};

interface ICourseDto {
    id: string;
    internalId: string;
    name: string;
    creditValue: number;
    url: string;
    courseClassesUrl: string;
    requiredCoursesUrl: string;
    requiredCreditsUrl: string;
}

/////////////////// Credits stuff ///////////////////

export const requiredCreditsToDto = (requiredCredits: IProgramRequiredCredits, scope: API_SCOPE, courseId: string): IBuildingDistanceDto => {
    const url = getRequiredCreditsResourceUrl(courseId, requiredCredits.programId, scope);
    return {
        courseId,
        programId: requiredCredits.programId,
        requiredCredits: requiredCredits.requiredCredits.toString(),
        url,
        courseUrl: getResourceUrl(RESOURCES.COURSE, scope, courseId),
        programUrl: getResourceUrl(RESOURCES.PROGRAM, scope, requiredCredits.programId)
    }
};

export const requiredCreditsListToDto = (requiredCredits: IProgramRequiredCredits[], scope: API_SCOPE, courseId: string): IBuildingDistanceDto[] => {
    return requiredCredits.map(p => requiredCreditsToDto(p, scope, courseId));
};

export const getRequiredCreditsResourceUrl = (courseId: string, programId: string, scope: API_SCOPE): string => {
    return applyPathToBase(getResourceUrl(RESOURCES.COURSE, scope, courseId), `/required-credits/${programId}`);
};

interface IBuildingDistanceDto {
    courseId: string;
    programId: string;
    requiredCredits: string;
    url: string;
    courseUrl: string;
    programUrl: string;
}
