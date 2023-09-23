import Term from '../models/abstract/term.model';
import { getDateISO } from '../helpers/time.helper';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { booleanToString } from '../helpers/string.helper';

export const termToDto = (term: Term, scope: API_SCOPE): ITermDto => {
    const url = getResourceUrl(RESOURCES.TERM, scope, term.id);
    return {
        id: term.id,
        internalId: term.internalId,
        name: term.name,
        published: term.published,
        startDate: getDateISO(term.startDate),
        url,
        courseClassesUrl: applyPathToBase(url, 'course-classes')
    };
};

export const paginatedTermsToDto = (paginatedTerms: PaginatedCollection<Term>, scope: API_SCOPE): ITermDto[] => {
    return paginatedTerms.collection.map(t => termToDto(t, scope));
};

export const paginatedTermsToLinks = (paginatedTerms: PaginatedCollection<Term>, basePath: string, limit: number, filter?: string, startDate?: string, published?: boolean): Record<string, string> => {
    return getPaginatedLinks(paginatedTerms, paginatedTermsUrlBuilder, basePath, limit, filter, startDate, published);
};

const paginatedTermsUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, startDate?: string, published?: boolean): string => {
    const params = {
        page,
        limit,
        filter,
        startDate,
        published: booleanToString(published)
    };
    return queryParamsStringBuilder(basePath, params);
};

interface ITermDto {
    id: string;
    internalId: string;
    name: string;
    published: boolean;
    startDate: string;
    url: string;
    courseClassesUrl: string;
}
