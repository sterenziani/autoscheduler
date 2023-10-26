import Course from './course.model';
import GenericModel from './generic.model';
import Lecture from './lecture.model';

export default abstract class CourseClass extends GenericModel {
    // Properties
    internalId: string;
    name: string;
    // Populated
    courseId: string;
    termId: string;

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string, courseId: string, termId: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
        this.courseId = courseId;
        this.termId = termId;
    }

    // Methods
    public abstract getLectures(): Promise<Lecture[] | undefined>;
    public abstract getWeeklyClassTimeInMinutes(): Promise<number | undefined>;
    public abstract getCourse(): Promise<Course | undefined>;
}
