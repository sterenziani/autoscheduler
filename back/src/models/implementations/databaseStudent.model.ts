import Course from "../abstract/course.model";
import Student from "../abstract/student.model";

export default class DatabaseStudent extends Student {
    public async getEnabledCourses(programId: string): Promise<Course[]> {
        throw new Error("Method not implemented.");
    } 
}
