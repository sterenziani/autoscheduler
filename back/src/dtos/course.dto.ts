import { ICourse } from '../models/course.model';

export const courseToDto = (course: ICourse): ICourseDto => {
    const courseUrl = getCourseUrl(course.id);
    return {
        id: course.id,
        url: courseUrl,
        name: course.name,
        code: course.code,
    };
};

export const getCourseUrl = (courseId: string): string => {
    return `/api/course/${courseId}`;
};

interface ICourseDto {
    id: string;
    url: string;
    name: string;
    code: string;
}
