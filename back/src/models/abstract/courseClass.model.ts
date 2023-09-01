import { DAY } from '../../constants/time.constants';
import Course from './course.model';
import GenericModel from './generic.model';
import Lecture from './lecture.model';
import Term from './term.model';

export default abstract class CourseClass extends GenericModel {
    // Properties
    name: string;

    // Abstract class constructor
    constructor(id: string, name: string) {
        super(id);
        this.name = name;
    }

    // Methods
    public abstract getTerm(): Promise<Term>;
    public abstract setTerm(termId: string): Promise<void>;
    public abstract getLectures(): Promise<Lecture[]>;
    public abstract getWeeklyClassTimeInMinutes(): Promise<number>;
    public abstract getDaysWithLectures(): Promise<Set<DAY>>;
    public abstract getCourse(): Promise<Course>;
    public abstract setCourse(courseId: string): Promise<void>;
}
