import Course from "../abstract/course.model";
import CourseClass from "../abstract/courseClass.model";

export default class DatabaseCourse extends Course {
    public getRequiredCoursesForProgram(programId: string): Promise<Course[]> {
        throw new Error("Method not implemented.");
    }
    public getCourseClasses(termId: string): Promise<CourseClass[]> {
        throw new Error("Method not implemented.");
    }

}