import Course from "../abstract/course.model";
import CourseClass from "../abstract/courseClass.model";
import Lecture from "../abstract/lecture.model";

export default class DatabaseCourseClass extends CourseClass {
    public getLectures(): Promise<Lecture[]> {
        throw new Error("Method not implemented.");
    }
    public getWeeklyClassTimeInMinutes(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    public getCourse(): Promise<Course> {
        throw new Error("Method not implemented.");
    }

}