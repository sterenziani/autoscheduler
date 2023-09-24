import { ERRORS } from '../../constants/error.constants';
import Course from '../../models/abstract/course.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class CourseDao extends GenericDao<Course> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.COURSE);
    }

    // Abstract Methods Signature Override
    public abstract create(universityId: string, internalId: string, name: string): Promise<Course>;
    public abstract modify(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Course>;
    public abstract delete(id: string, universityIdFilter: string): Promise<void>;

    public abstract findById(id: string, universityIdFilter?: string): Promise<Course | undefined>;
    public abstract findPaginated(page: number, limit: number, textSearch?: string, programId?: string, optional?: boolean, universityId?: string): Promise<PaginatedCollection<Course>>;

    // Abstract Methods
    public abstract findPaginatedRequiredCourses(page: number, limit: number, id: string, textSearch?: string, programId?: string, universityId?: string): Promise<PaginatedCollection<Course>>;
    public abstract findPaginatedRemainingCourses(page: number, limit: number, studentId: string, programId: string, universityId: string, textSearch?: string, optional?: boolean): Promise<PaginatedCollection<Course>>;
    public abstract findPaginatedCompletedCourses(page: number, limit: number, studentId: string, textSearch?: string, optional?: boolean, programId?: string, universityId?: string): Promise<PaginatedCollection<Course>>;

    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string): Promise<Course> {
        return await super.getById(id, universityIdFilter);
    }
}
