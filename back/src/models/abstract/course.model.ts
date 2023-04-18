import CourseClass from "./courseClass.model";
import University from "./university.model";

export default abstract class Course {
    // Properties
    id: string;             // Id of the course in our databases
    internalId: string;     // Internal id of the course as given by the university on creation
    name: string;           // Name of the course as given by the university on creation

    // Abstract class constructor
    protected constructor(id: string, internalId: string, name: string) {
        this.id = id;
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract setRequiredCourse(courseId: string): Promise<void>;
    public abstract getRequiredCourses(): Promise<Course[]>;
    public abstract getCourseClasses(termId: string): Promise<CourseClass[]>;
    public abstract getUniversity(): Promise<University>;
}
