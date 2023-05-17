import Student from '../models/abstract/student.model';
import User from '../models/abstract/user.model';
import * as UserDto from './user.dto';

export const studentToDto = (user: User, student: Student): IStudentDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(user);
    return {
        ...userDto,
        approvedCoursesUrl: `${userDto.url}/completed-courses`,
    };
};

type IStudentDto = UserDto.IUserDto & {
    approvedCoursesUrl: string;
};
