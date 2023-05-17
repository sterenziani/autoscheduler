import University from '../models/abstract/university.model';
import User from '../models/abstract/user.model';
import * as UserDto from './user.dto';
import { ROLE } from '../constants/general.constants';
import { getUserUrl } from './user.dto';
import { queryParamsStringBuilder } from '../helpers/url.helper';

export const universityToDto = (user: User, university: University): IUniversityDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(user);
    return {
        ...userDto,
        name: university.name,
        verified: university.verified,
    };
};

export const getUniversityCoursesUrl = (
    universityId: string,
    text?: string,
    page?: number,
    pageSize?: number,
): string => {
    const params = {
        filter: text,
        page: page ? page.toString() : undefined,
        pageSize: pageSize ? pageSize.toString() : undefined,
    };
    return `${getUserUrl(universityId, ROLE.UNIVERSITY)}/courses${queryParamsStringBuilder(params)}`;
};

type IUniversityDto = UserDto.IUserDto & {
    name: string;
    verified: boolean;
};
