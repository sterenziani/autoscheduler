import Student from '../models/abstract/student.model';
import University from '../models/abstract/university.model';
import Program from '../models/abstract/program.model';
import * as UserDto from './user.dto';
import * as UniversityDto from './university.dto';
import * as ProgramDto from './program.dto';

export const studentToDto = (student: Student, university: University, program: Program): IStudentDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(student);
    const universityUrl: string = UniversityDto.getUniversityUrl(university.id);
    const programUrl : string = ProgramDto.getProgramUrl(program.id);

    return {
        ...userDto,
        approvedCoursesUrl: `${userDto.url}/completed-courses`,
        universityUrl: universityUrl,
        programUrl: programUrl,
    };
};

type IStudentDto = UserDto.IUserDto & {
    approvedCoursesUrl: string,
    universityUrl: string,
    programUrl: string
};
