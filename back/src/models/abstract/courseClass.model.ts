import Course from "./course.model";
import Lecture from "./lecture.model";
import Term from "./term.model";

export default abstract class CourseClass {
    // Properties
    id: string;
    name: string;

    // Abstract class constructor
    protected constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    // Methods
    public abstract getTerm(): Promise<Term>;
    public abstract getLectures(): Promise<Lecture[]>;
    public abstract getCourse(): Promise<Course>;
}