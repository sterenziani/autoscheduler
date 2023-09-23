import Building from './building.model';
import Course from './course.model';
import GenericModel from './generic.model';
import Program from './program.model';
import Student from './student.model';
import Term from './term.model';
import User from './user.model';

export default abstract class University extends GenericModel {
    // Properties
    name: string;
    verified: boolean;

    // Abstract class constructor.
    constructor(id: string, name: string, verified: boolean) {
        super(id);
        this.name = name;
        this.verified = verified;
    }

    // Methods
    public abstract getUser(): Promise<User>;
    public abstract getPrograms(): Promise<Program[]>;
    public abstract getBuildings(): Promise<Building[]>;
    public abstract getCourses(): Promise<Course[]>;
    public abstract getTerms(): Promise<Term[]>;
    public abstract getStudents(): Promise<Student[]>;
}
