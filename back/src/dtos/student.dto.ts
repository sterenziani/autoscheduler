import Student from '../models/abstract/student.model';
import User from '../models/abstract/user.model';
import * as UserDto from './user.dto';

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
