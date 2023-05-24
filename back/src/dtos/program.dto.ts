import Program from '../models/abstract/program.model';
import University from '../models/abstract/university.model';
import { getUserUrl } from './user.dto';
import { ROLE } from '../constants/general.constants';
import { queryParamsStringBuilder } from '../helpers/url.helper';

export const programToDto = (program: Program, university: University): IProgramDto => {
    return {
        id: program.id,
        url: getProgramUrl(program.id),
        name: program.name,
        code: program.internalId,
        mandatoryCoursesUrl: getProgramMandatoryCoursesUrl(program.id),
        optionalCoursesUrl: getProgramOptionalCoursesUrl(program.id),
        universityId: university.id,
        universityUrl: getUserUrl(university.id, ROLE.UNIVERSITY),
    };
};

export const getProgramUrl = (programId: string): string => {
    return `program/${programId}`;
};

export const getProgramMandatoryCoursesUrl = (programId: string, page?: number, pageSize?: number): string => {
    const params = {
        page: page !== undefined ? page.toString() : page,
        pageSize: pageSize !== undefined ? pageSize.toString() : pageSize,
    };
    return `${getProgramUrl(programId)}/mandatory-courses${queryParamsStringBuilder(params)}`;
};

export const getProgramOptionalCoursesUrl = (programId: string, page?: number, pageSize?: number): string => {
    const params = {
        page: page !== undefined ? page.toString() : page,
        pageSize: pageSize !== undefined ? pageSize.toString() : pageSize,
    };
    return `${getProgramUrl(programId)}/optional-courses${queryParamsStringBuilder(params)}`;
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
