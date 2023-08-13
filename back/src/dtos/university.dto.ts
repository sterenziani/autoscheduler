import University from '../models/abstract/university.model';
import * as UserDto from './user.dto';
import { ROLE } from '../constants/general.constants';
import { getUserUrl } from './user.dto';
import { queryParamsStringBuilder } from '../helpers/url.helper';

export const universityToDto = (university: University): IUniversityDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(university);
    return {
        ...userDto,
        name: university.name,
        verified: university.verified,
    };
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
};
