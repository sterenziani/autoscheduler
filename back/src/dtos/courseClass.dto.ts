import CourseClass from '../models/abstract/courseClass.model';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';

export const courseClassToDto = (courseClass: CourseClass, scope: API_SCOPE): ICourseClassDto => {
    const url = getResourceUrl(RESOURCES.COURSE_CLASS, scope, courseClass.id);
    return {
        id: courseClass.id,
        name: courseClass.name,
        url,
        lecturesUrl: applyPathToBase(url, 'lectures'),
    };
};

export const paginatedCourseClassesToDto = (paginatedCourseClasses: PaginatedCollection<CourseClass>, scope: API_SCOPE): ICourseClassDto[] => {
    return paginatedCourseClasses.collection.map(c => courseClassToDto(c, scope));
};

export const paginatedCourseClassesToLinks = (paginatedCourseClasses: PaginatedCollection<CourseClass>, basePath: string, limit: number, filter?: string, courseId?: string, termId?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedCourseClasses, paginatedCourseClassesUrlBuilder, basePath, limit, filter, courseId, termId);
};

const paginatedCourseClassesUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, courseId?: string, termId?: string): string => {
    const params = {
        page,
        limit,
        filter,
        courseId,
        termId
    };
    return queryParamsStringBuilder(basePath, params);
};

interface ICourseClassDto {
    id: string;
    name: string;
    url: string;
    lecturesUrl: string;
}
