import Term from '../models/abstract/term.model';
import { getDateISO } from '../helpers/time.helper';

export const termToDto = (term: Term): ITermDto => {
    return {
        id: term.id,
        url: getTermUrl(term.id),
        name: term.name,
        code: term.internalId,
        published: term.published,
        startDate: getDateISO(term.startDate),
    };
};

export const getTermUrl = (termId: string): string => {
    return `term/${termId}`;
};

interface ITermDto {
    id: string;
    url: string;
    name: string;
    code: string;
    published: boolean;
    startDate: string;
}
