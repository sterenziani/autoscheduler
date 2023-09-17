import { queryParamsStringBuilder } from '../helpers/url.helper';
import Student from '../models/abstract/student.model';
import University from '../models/abstract/university.model';
import Program from '../models/abstract/program.model';
import * as UserDto from './user.dto';
import * as UniversityDto from './university.dto';
import * as ProgramDto from './program.dto';

export const studentToDto = (student: Student, university: University, program: Program | undefined): IStudentDto => {
    const userDto: UserDto.IUserDto = UserDto.userToDto(student);
    const universityUrl: string = UniversityDto.getUniversityUrl(university.id);
    if(program){
        const programUrl: string = ProgramDto.getProgramUrl(program.id);
        return {
            ...userDto,
            name: student.name,
            approvedCoursesUrl: `${userDto.url}/completed-courses`,
            universityUrl: universityUrl,
            programUrl: programUrl,
        };
    }

    return {
        ...userDto,
        name: student.name,
        approvedCoursesUrl: `${userDto.url}/completed-courses`,
        universityUrl: universityUrl,
    };
};

export const getRemainingCoursesUrl = (
    studentId: string,
    programId: string,
    filter?: string,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        filter,
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder(`student/${studentId}/remaining-courses/${programId}`, params);
};

export const getCompletedCoursesUrl = (
    studentId: string,
    page?: number,
    perPage?: number,
): string => {
    const params = {
        page: page ? page.toString() : undefined,
        per_page: perPage ? perPage.toString() : undefined,
    };
    return queryParamsStringBuilder(`student/${studentId}/completed-courses`, params);
};

type IStudentDto = UserDto.IUserDto & {
    approvedCoursesUrl: string;
    universityUrl: string;
    programUrl?: string;
    name: string;
};
