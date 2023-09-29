import CourseClass from './courseClass.model';
import GenericModel from './generic.model';

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
    public abstract getRequiredCoursesForProgram(programId: string): Promise<Course[] | undefined>;
    public abstract getAmountOfIndirectCorrelatives(programId: string): Promise<number | undefined>;
    public abstract getCourseClasses(termId: string): Promise<CourseClass[] | undefined>;
}
