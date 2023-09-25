import Course from './course.model';
import GenericModel from './generic.model';
import Lecture from './lecture.model';

export default abstract class CourseClass extends GenericModel {
    // Properties
    internalId: string;
    name: string;

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract getLectures(): Promise<Lecture[]>;
    public abstract getWeeklyClassTimeInMinutes(): Promise<number>;
    public abstract getCourse(): Promise<Course>;
}
