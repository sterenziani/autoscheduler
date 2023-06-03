import Program from '../models/abstract/program.model';
import { getUserUrl } from './user.dto';
import { ROLE } from '../constants/general.constants';
import { queryParamsStringBuilder } from '../helpers/url.helper';

export const programToDto = (program: Program, universityId: string): IProgramDto => {
    return {
        id: program.id,
        url: getProgramUrl(program.id),
        name: program.name,
        code: program.internalId,
        mandatoryCoursesUrl: getProgramMandatoryCoursesUrl(program.id),
        optionalCoursesUrl: getProgramOptionalCoursesUrl(program.id),
        universityId: universityId,
        universityUrl: getUserUrl(universityId, ROLE.UNIVERSITY),
    };
};

export const getProgramUrl = (programId: string): string => {
    return `program/${programId}`;
};

export const getProgramMandatoryCoursesUrl = (programId: string, page?: number, perPage?: number): string => {
    const params = {
        page: page !== undefined ? page.toString() : page,
        per_page: perPage !== undefined ? perPage.toString() : perPage,
    };
    return queryParamsStringBuilder(`${getProgramUrl(programId)}/mandatory-courses`, params);
};

export const getProgramOptionalCoursesUrl = (programId: string, page?: number, perPage?: number): string => {
    const params = {
        page: page !== undefined ? page.toString() : page,
        per_page: perPage !== undefined ? perPage.toString() : perPage,
    };
    return queryParamsStringBuilder(`${getProgramUrl(programId)}/optional-courses`, params);
};

interface IProgramDto {
    id: string;
    url: string;
    name: string;
    code: string;
    mandatoryCoursesUrl: string;
    optionalCoursesUrl: string;
    universityId: string;
    universityUrl: string;
}
