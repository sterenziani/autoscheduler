import { Course } from '../models/course.interface';

export const courseToDto = (course: Course): ICourseDto => {
    const courseUrl = getCourseUrl(course.id);
    const universityUrl = 'TODO';
    return {
        id: course.id,
        url: courseUrl,
        name: course.name,
        code: course.internalId,
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
