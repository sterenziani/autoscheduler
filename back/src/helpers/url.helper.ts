import { Request } from "express";
import { PaginatedCollection } from "../interfaces/paging.interface";
import { API_SCOPE, BASE_PATH, RESOURCES } from "../constants/general.constants";

export const queryParamsStringBuilder = (baseUrl: string, params: { [param: string]: string | string[] | undefined }): string => {
    let queryParamString = '';
    for (const param of Object.keys(params)) {
        if (params[param] !== undefined && Array.isArray(params[param])) {
            for (const arrayEntry of params[param]!) {
                queryParamString = `${queryParamString}&${param}=${encodeURIComponent(arrayEntry ?? '')}`
            }
        } else {
            queryParamString = `${queryParamString}${
                params[param] ? `&${param}=${encodeURIComponent((params[param] as string) ?? '')}` : ''
            }`;
        }
    }
    return `${baseUrl}/${queryParamString.replace('&', '?')}`;
};

export const getReqPath = (req: Request): string => {
    return req.originalUrl.split('?')[0]
}

export const getPaginatedLinks = <T>(paginatedCollection: PaginatedCollection<T>, urlBuiler: (basePath: string, page: string, limit: string, ...args: any[]) => string, basePath: string, limit: number, ...args: any[]): Record<string, string> => {
    const links: Record<string, string> = {};
    for (const [key, value] of Object.entries(paginatedCollection.pagingInfo)) {
        links[key] = urlBuiler(basePath, value, limit.toString(), ...args);
    }
    return links;
}

export const applyPathToBase = (basePath: string, path?: string): string => {
    return `${basePath}${path ? `/${path}` : ''}`;
}

export const getResourceUrl = (resource: RESOURCES, scope: API_SCOPE, resourceId: string): string => {
    const basePath = BASE_PATH;
    switch (resource) {
        case RESOURCES.PASSWORD_RECOVERY_TOKEN:
            return `${basePath}auth/password-recovery-tokens/${resourceId}`;
        case RESOURCES.USER:
            return scope === API_SCOPE.ROOT ? `${basePath}users/${resourceId}` : `${basePath}user`;
        case RESOURCES.UNIVERSITY:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university`;
                case API_SCOPE.ROOT: return `${basePath}universities/${resourceId}`;
            }
        case RESOURCES.PROGRAM:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university/programs/${resourceId}`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/programs/${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}programs/${resourceId}`;
            }
        case RESOURCES.COURSE:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university/courses/${resourceId}`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/courses/${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}courses/${resourceId}`
            }
        case RESOURCES.COURSE_CLASS:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university/course-class/${resourceId}`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/courses/course-class${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}course-class/${resourceId}`
            }
        case RESOURCES.LECTURE:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university/lectures/${resourceId}`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/lectures/${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}lectures/${resourceId}`
            }
        case RESOURCES.TERM:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university/terms/${resourceId}`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/terms/${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}terms/${resourceId}`
            }
        case RESOURCES.BUILDING:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student/university/buildings/${resourceId}`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/buildings/${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}buildings/${resourceId}`
            }
        case RESOURCES.STUDENT:
            switch (scope) {
                case API_SCOPE.STUDENT: return `${basePath}student`;
                case API_SCOPE.UNIVERSITY: return `${basePath}university/students/${resourceId}`;
                case API_SCOPE.ROOT: return `${basePath}students/${resourceId}`
            }
    }
}
