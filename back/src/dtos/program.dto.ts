import Program from '../models/abstract/program.model';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';

export const programToDto = (program: Program, scope: API_SCOPE): IProgramDto => {
    const url = getResourceUrl(RESOURCES.PROGRAM, scope, program.id);
    return {
        id: program.id,
        internalId: program.internalId,
        name: program.name,
        url,
        coursesUrl: applyPathToBase(url, 'courses')
    };
};

export const paginatedProgramsToDto = (paginatedPrograms: PaginatedCollection<Program>, scope: API_SCOPE): IProgramDto[] => {
    return paginatedPrograms.collection.map(p => programToDto(p, scope));
};

export const paginatedProgramsToLinks = (paginatedPrograms: PaginatedCollection<Program>, basePath: string, limit: number, filter?: string, universityId?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedPrograms, paginatedProgramsUrlBuilder, basePath, limit, filter, universityId);
};

const paginatedProgramsUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, universityId?: string): string => {
    const params = {
        page,
        limit,
        filter,
        universityId
    };
    return queryParamsStringBuilder(basePath, params);
};

interface IProgramDto {
    id: string;
    internalId: string;
    name: string;
    url: string;
    coursesUrl: string;
}
