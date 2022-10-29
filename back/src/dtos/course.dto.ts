import { ICourse } from '../models/course.model';

export const courseToDto = (course: ICourse): ICourseDto => {
    const courseUrl = getCourseUrl(course.id);
    const universityUrl = 'TODO';
    return {
        id: course.id,
        url: courseUrl,
        name: course.name,
        code: course.code,
        universityId: course.universityId,
        universityUrl,
    };
};

export const getCourseUrl = (courseId: string): string => {
    return `/course/${courseId}`;
};

interface ICourseDto {
    id: string;
    url: string;
    name: string;
    code: string;
    universityId: string;
    universityUrl: string;
}
