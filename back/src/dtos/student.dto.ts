import { IUser } from '../models/user.model';
import * as UserDto from './user.dto';
import { IStudent } from '../models/student.model';

export const toDto = (user: IUser, student: IStudent): IStudentDto => {
    const userDto: UserDto.IUserDto = UserDto.toDto(user);
    return {
        ...userDto,
        approvedCoursesUrl: `${userDto.url}/courses`,
    };
};

type IStudentDto = UserDto.IUserDto & {
    approvedCoursesUrl: string;
};
