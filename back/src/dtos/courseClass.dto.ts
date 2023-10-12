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
        courseUrl: getResourceUrl(RESOURCES.COURSE, scope, courseClass.courseId),
        termUrl: getResourceUrl(RESOURCES.TERM, scope, courseClass.termId)
    };
};

export const paginatedCourseClassesToDto = (paginatedCourseClasses: PaginatedCollection<CourseClass>, scope: API_SCOPE): ICourseClassDto[] => {
    return paginatedCourseClasses.collection.map(c => courseClassToDto(c, scope));
};

export const paginatedCourseClassesToLinks = (paginatedCourseClasses: PaginatedCollection<CourseClass>, basePath: string, limit: number, filter?: string, termId?: string, courseId?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedCourseClasses, paginatedCourseClassesUrlBuilder, basePath, limit, filter, termId, courseId);
};

const paginatedCourseClassesUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, termId?: string, courseId?: string): string => {
    const params = {
        page,
        limit,
        filter,
        termId,
        courseId,
    };
    return queryParamsStringBuilder(basePath, params);
};

interface ICourseClassDto {
    id: string;
    name: string;
    url: string;
    lecturesUrl: string;
    courseUrl: string;
    termUrl: string;
}
