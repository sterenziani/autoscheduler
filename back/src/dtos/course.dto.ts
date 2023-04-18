import Course from "../models/abstract/course.model";

export const courseToDto = (course: Course): ICourseDto => {
    const courseUrl = getCourseUrl(course.id);
    const universityUrl = 'TODO';
    return {
        id: course.id,
        url: courseUrl,
        name: course.name,
        code: course.internalId,
        //universityId: course.universityId, TODO: for this we can of need this method to be async and do await course.getUniversity() or pass university as parameter of the courseToDto function
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
    //universityId: string;
    universityUrl: string;
}
