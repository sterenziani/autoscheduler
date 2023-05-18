import Student from '../models/abstract/student.model';
import * as UserDto from './user.dto';

export const studentToDto = (student: Student): IStudentDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(student);
    return {
        ...userDto,
        approvedCoursesUrl: `${userDto.url}/completed-courses`,
    };
};

type IStudentDto = UserDto.IUserDto & {
    approvedCoursesUrl: string;
};
