import { ERRORS } from '../../constants/error.constants';
import Course from '../../models/abstract/course.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class CourseDao extends GenericDao<Course> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.COURSE);
    }

    // Abstract Methods
    public abstract create(universityId: string, internalId: string, name: string): Promise<Course>;
    public abstract findByInternalId(universityId: string, internalId: string): Promise<Course | undefined>;
    public abstract getByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Course>>;
}
