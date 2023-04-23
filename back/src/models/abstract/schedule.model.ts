import TimeRange from "../../helpers/classes/timeRange.class";
import CourseClass from "./courseClass.model";
import GenericModel from "./generic.model";
import Student from "./student.model";
import Term from "./term.model";

export default abstract class Schedule extends GenericModel {
    // Properties

    // Abstract class constructor
    constructor(id: string, ) {
        super(id)
    }

    // Methods
    public abstract getStudent(): Promise<Student>;
    public abstract getTerm(): Promise<Term>;
    public abstract addCourseClass(courseClassId: string): Promise<void>;
    public abstract getCourseClasses(): Promise<CourseClass[]>;
    // TODO: if we use the getCourseClasses getTerm and getStudent methods, maybe its inefficient but we can have a single implementation of this method
    public abstract getScore(credits: number, availableTimes: TimeRange[], reduceDays: boolean, prioritizeCourseRequirements: boolean): Promise<number>; 
}