import { User } from '../models/user.interface';
import { University } from '../models/university.interface';
import * as UserDto from './user.dto';

export const toDto = (user: User, university: University): IUniversityDto => {
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
