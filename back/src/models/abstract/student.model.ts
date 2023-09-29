import Course from './course.model';
import GenericModel from './generic.model';

export default abstract class Student extends GenericModel {
    // Properties
    name: string; // Name of the student

    // Abstract class constructor
    constructor(id: string, name: string) {
        super(id);
        this.name = name;
    }

    // Methods
    public abstract getEnabledCourses(programId: string): Promise<Course[] | undefined>;
}
