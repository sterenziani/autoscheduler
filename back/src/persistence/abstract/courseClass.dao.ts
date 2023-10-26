import { ERRORS } from '../../constants/error.constants';
import CourseClass from '../../models/abstract/courseClass.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class CourseClassDao extends GenericDao<CourseClass> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.COURSE_CLASS);
    }

    // Abstract Methods Signature Override
    public abstract create(universityId: string, courseId: string, termId: string, internalId: string, name: string): Promise<CourseClass>;
    public abstract modify(id: string, universityIdFilter: string, courseIdFilter?: string, termId?: string, internalId?: string, name?: string): Promise<CourseClass>;
    public abstract delete(id: string, universityIdFilter: string, courseIdFilter?: string): Promise<void>;

    public abstract findById(id: string, universityIdFilter?: string, courseIdFilter?: string): Promise<CourseClass | undefined>;
    public abstract findPaginated(page: number, limit: number, textSearch?: string, courseId?: string, termId?: string, universityId?: string): Promise<PaginatedCollection<CourseClass>>;

    // Abstract Methods
    
    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string, courseIdFilter?: string): Promise<CourseClass> {
        return await super.getById(id, universityIdFilter, courseIdFilter);
    }
}
