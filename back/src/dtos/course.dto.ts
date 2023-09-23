import Course from '../models/abstract/course.model';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { booleanToString } from '../helpers/string.helper';

export const courseToDto = (course: Course, scope: API_SCOPE): ICourseDto => {
    const url = getResourceUrl(RESOURCES.COURSE, scope, course.id);
    return {
        id: course.id,
        internalId: course.internalId,
        name: course.name,
        url,
        courseClassesUrl: applyPathToBase(url, 'course-classes'),
        requiredCoursesUrl: applyPathToBase(url, 'required-courses')
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
    url: string;
    courseClassesUrl: string;
    requiredCoursesUrl: string;
}
