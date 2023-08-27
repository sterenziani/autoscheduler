import University from '../models/abstract/university.model';
import * as UserDto from './user.dto';
import { ROLE } from '../constants/general.constants';
import { getUserUrl } from './user.dto';
import { queryParamsStringBuilder } from '../helpers/url.helper';
import { getDateISO } from '../helpers/time.helper';

export const universityToDto = (university: University): IUniversityDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(university);
    return {
        ...userDto,
        name: university.name,
        verified: university.verified,
        coursesUrl: getUniversityCoursesUrl(university.id),
        programsUrl: getUniversityProgramsUrl(university.id),
        buildingsUrl: getUniversityBuildingsUrl(university.id),
        termsUrl: getUniversityTermsUrl(university.id),
    };
};

export const getUniversityBuildingsUrl = (
    universityId: string,
    filter?: string,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        filter,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder(`${getUserUrl(universityId, ROLE.UNIVERSITY)}/buildings`, params);
};

export const getUniversityCoursesUrl = (
    universityId: string,
    filter?: string,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        filter,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder(`${getUserUrl(universityId, ROLE.UNIVERSITY)}/courses`, params);
};

export const getUniversityProgramsUrl = (
    universityId: string,
    filter?: string,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        filter,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder(`${getUserUrl(universityId, ROLE.UNIVERSITY)}/programs`, params);
};

export const getUniversityTermsUrl = (
    universityId: string,
    filter?: string,
    published?: boolean,
    from?: Date,
    to?: Date,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        filter,
        published: published !== undefined ? published.toString() : undefined,
        from: from ? getDateISO(from) : undefined,
        to: to ? getDateISO(to) : undefined,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder(`${getUserUrl(universityId, ROLE.UNIVERSITY)}/terms`, params);
};

export const getUniversitiesUrl = (filter?: string, page?: number, perPage?: number): string => {
    const params = {
        filter,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder('universities', params);
};

export const getUniversityUrl = (universityId: string): string => {
    return getUserUrl(universityId, ROLE.UNIVERSITY);
};

type IUniversityDto = UserDto.IUserDto & {
    name: string;
    verified: boolean;
    programsUrl: string;
    coursesUrl: string;
    buildingsUrl: string;
    termsUrl: string;
};
