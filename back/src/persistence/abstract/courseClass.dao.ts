import { ERRORS } from '../../constants/error.constants';
import CourseClass from '../../models/abstract/courseClass.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class CourseClassDao extends GenericDao<CourseClass> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.COURSE_CLASS);
    }

    // Abstract Methods
    public abstract create(courseId: string, termId: string, name: string): Promise<CourseClass>;
    public abstract findByCourseId(
        courseId: string,
        termId?: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<CourseClass>>;
}
