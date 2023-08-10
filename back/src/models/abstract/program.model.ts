import Course from './course.model';
import GenericModel from './generic.model';
import University from './university.model';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class Program extends GenericModel {
    // Properties
    internalId: string; // Internal id of the program as given by the university on creation
    name: string; // Name of the program

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract addCourse(courseId: string, optional: boolean): Promise<void>;
    public abstract getMandatoryCourses(limit?: number, offset?: number): Promise<PaginatedCollection<Course>>;
    public abstract getOptionalCourses(limit?: number, offset?: number): Promise<PaginatedCollection<Course>>;
    public abstract getUniversity(): Promise<University>;
}
