import { ROLE } from "../../constants/general.constants";
import Course from "./course.model";
import Program from "./program.model";
import Schedule from "./schedule.model";
import University from "./university.model";
import User from "./user.model";

// Student extends User and so it has all the properties of an User as well
export default abstract class Student extends User {
    // Properties
    internalId: string;      // The internal student id the university assigns to their students
    name: string;           // Name of the student

    // Abstract class constructor. University and Student require an existing user, so they are the only ones that have required id in constructor
    constructor(userId: string, email: string, password: string, internalId: string, name: string) {
        super(userId, email, password, ROLE.STUDENT);
        this.internalId = internalId;
        this.name = name; 
    }

    // Methods
    public abstract getUniversity(): Promise<University>;
    public abstract getProgram(): Promise<Program>;
    public abstract getCompletedCourses(): Promise<Course[]>;
    public abstract addCompletedCourse(courseId: string): Promise<void>;
    public abstract deleteCompletedCourse(courseId: string): Promise<void>;
    public abstract getSchedules(termId: string): Promise<Schedule[]>;
}
