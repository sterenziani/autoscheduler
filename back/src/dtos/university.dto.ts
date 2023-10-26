import University from '../models/abstract/university.model';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { booleanToString } from '../helpers/string.helper';

export const universityToDto = (university: University, scope: API_SCOPE): IUniversityDto => {
    const url = getResourceUrl(RESOURCES.UNIVERSITY, scope, university.id);
    return {
        id: university.id,
        name: university.name,
        verified: university.verified,
        url,
        coursesUrl: applyPathToBase(url, 'courses'),
        programsUrl: applyPathToBase(url, 'programs'),
        buildingsUrl: applyPathToBase(url, 'buildings'),
        termsUrl: applyPathToBase(url, 'terms'),
        studentsUrl: applyPathToBase(url, 'students'),
        courseClassesUrl: applyPathToBase(url, 'course-classes')
    };
};

export const paginatedUniversitiesToDto = (paginatedUniversities: PaginatedCollection<University>, scope: API_SCOPE): IUniversityDto[] => {
    return paginatedUniversities.collection.map(u => universityToDto(u, scope));
};

export const paginatedUniversitiesToLinks = (paginatedUniversities: PaginatedCollection<University>, basePath: string, limit: number, filter?: string, verified?: boolean): Record<string, string> => {
    return getPaginatedLinks(paginatedUniversities, paginatedUniversitiesUrlBuilder, basePath, limit, filter, verified);
};

const paginatedUniversitiesUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, verified?: boolean): string => {
    const params = {
        page,
        limit,
        filter,
        verified: booleanToString(verified)
    };
    return queryParamsStringBuilder(basePath, params);
};

interface IUniversityDto {
    id: string;
    name: string;
    verified: boolean;
    url: string;
    programsUrl: string;
    coursesUrl: string;
    buildingsUrl: string;
    termsUrl: string;
    studentsUrl: string;
    courseClassesUrl: string;
}
