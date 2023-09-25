import Course from "../models/abstract/course.model";

export interface IProgramCourses {
    mandatoryCourses: Course[];
    optionalCourses: Course[];
}