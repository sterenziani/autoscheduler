import CourseClass from './courseClass.model';
import GenericModel from './generic.model';
import University from './university.model';

export default abstract class Course extends GenericModel {
    // Properties
    internalId: string; // Internal id of the course as given by the university on creation
    name: string; // Name of the course as given by the university on creation

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract setRequiredCourse(programId: string, courseId: string): Promise<void>;
    public abstract getRequiredCourses(programId: string): Promise<Course[]>;
    public abstract getCourseClasses(termId: string): Promise<CourseClass[]>;
    public abstract getUniversity(): Promise<University>;
}
