import Course from './course.model';
import GenericModel from './generic.model';
import Program from './program.model';
import University from './university.model';
import User from './user.model';

export default abstract class Student extends GenericModel {
    // Properties
    name: string; // Name of the student

    // Abstract class constructor
    constructor(id: string, name: string) {
        super(id);
        this.name = name;
    }

    // Methods
    public abstract getUser(): Promise<User>;
    public abstract getUniversity(): Promise<University>;
    public abstract getProgram(): Promise<Program | undefined>;
    public abstract getCompletedCourses(): Promise<Course[]>;
    public abstract addCompletedCourse(courseId: string): Promise<void>;
    public abstract deleteCompletedCourse(courseId: string): Promise<void>;
    public abstract getRemainingCoursesProgram(programId: string): Promise<Course[]>;
    public abstract getEnabledCourses(programId: string): Promise<Course[]>;
}
