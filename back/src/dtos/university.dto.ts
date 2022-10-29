import { IUser } from '../models/user.model';
import { IUniversity } from '../models/university.model';
import * as UserDto from './user.dto';

export const toDto = (user: IUser, university: IUniversity): IUniversityDto => {
    const userDto: UserDto.IUserDto = UserDto.toDto(user);
    return {
        ...userDto,
        name: university.name,
        verified: university.verified,
    };
};

type IUniversityDto = UserDto.IUserDto & {
    name: string;
    verified: boolean;
};
