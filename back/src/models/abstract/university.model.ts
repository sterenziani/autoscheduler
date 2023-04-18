import { ROLE } from "../../constants/general.constants";
import Building from "./building.model";
import Course from "./course.model";
import Program from "./program.model";
import Student from "./student.model";
import Term from "./term.model";
import User from "./user.model";

// University extends User and so it has all the properties of an User as well
export default abstract class University extends User {
    // Properties
    name: string;
    verified: boolean;

    // Abstract class constructor
    protected constructor(id: string, email: string, password: string, name: string, verified: boolean) {
        super(id, email, password, ROLE.UNIVERSITY);
        this.name = name;
        this.verified = verified;
    }

    // Methods
    public abstract getPrograms(): Promise<Program[]>;
    public abstract getBuildings(): Promise<Building[]>;
    public abstract getCourses(): Promise<Course[]>;
    public abstract getTerms(): Promise<Term[]>;
    public abstract getStudents(): Promise<Student[]>;
}
