import CourseClass from "./courseClass.model";
import University from "./university.model";

export default abstract class Term {
    // Properties
    id: string;             // Id of the term in our databases
    internalId: string;     // Internal id provided by university on creation
    name: string;           // Name of the term
    published: boolean;     // If it is public or not for students to see
    startDate: Date;        // Start date of the term

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string, published: boolean, startDate: Date) {
        this.id = id;
        this.internalId = internalId;
        this.name = name;
        this.published = published;
        this.startDate = startDate;
    }

    // Methods
    public abstract getCourseClasses(): Promise<CourseClass[]>;
    public abstract getUniversity(): Promise<University>;
}