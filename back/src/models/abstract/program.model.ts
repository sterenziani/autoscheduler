import Course from "./course.model";
import University from "./university.model";

export default abstract class Program {
    // Properties
    id: string;             // Id of program in our databases
    internalId: string;     // Internal id of the program as given by the university on creation
    name: string;           // Name of the program

    // Abstract class constructor
    protected constructor(id: string, internalId: string, name: string) {
        this.id = id;
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract addCourse(courseId: string, optional: boolean): Promise<void>;
    public abstract getMandatoryCourses(): Promise<Course[]>;
    public abstract getOptionalCourses(): Promise<Course[]>;
    public abstract getUniversity(): Promise<University>;
}