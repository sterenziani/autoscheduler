import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import Student from '../models/abstract/student.model';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';

export const studentToDto = (student: Student, scope: API_SCOPE): IStudentDto => {
    const url = getResourceUrl(RESOURCES.STUDENT, scope, student.id);
    const studentDto: IStudentDto = {
        id: student.id,
        name: student.name,
        url
    };
    if (scope === API_SCOPE.STUDENT) {
        studentDto.universityUrl = applyPathToBase(url, 'university'),
        studentDto.remainingCoursesUrl = applyPathToBase(url, 'remaining-courses'),
        studentDto.completedCoursesUrl = applyPathToBase(url, 'completed-courses'),
        studentDto.programUrl = applyPathToBase(url, 'program'),
        studentDto.schedulesUrl = applyPathToBase(url, 'schedules')
    }
    return studentDto;
};

export const paginatedStudentsToDto = (paginatedStudents: PaginatedCollection<Student>, scope: API_SCOPE): IStudentDto[] => {
    return paginatedStudents.collection.map(s => studentToDto(s, scope));
};

export const paginatedStudentsToLinks = (paginatedStudents: PaginatedCollection<Student>, basePath: string, limit: number, filter?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedStudents, paginatedStudentsUrlBuilder, basePath, limit, filter);
};

const paginatedStudentsUrlBuilder = (basePath: string, page: string, limit: string, filter?: string): string => {
    const params = {
        page,
        limit,
        filter
    };
    return queryParamsStringBuilder(basePath, params);
};

interface IStudentDto {
    id: string;
    name: string;
    url: string;
    universityUrl?: string;
    remainingCoursesUrl?: string;
    completedCoursesUrl?: string;
    programUrl?: string;
    schedulesUrl?: string;
};
