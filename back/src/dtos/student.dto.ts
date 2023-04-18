import { User } from '../models/user.interface';
import * as UserDto from './user.dto';
import { Student } from '../models/student.interface';

export const toDto = (user: User, student: Student): IStudentDto => {
    const userDto: UserDto.IUserDto = UserDto.toDto(user);
    return {
        ...userDto,
        approvedCoursesUrl: `${userDto.url}/courses`,
    };
};

type IStudentDto = UserDto.IUserDto & {
    approvedCoursesUrl: string;
};
