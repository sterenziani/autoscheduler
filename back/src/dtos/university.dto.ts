import University from '../models/abstract/university.model';
import User from '../models/abstract/user.model';
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
