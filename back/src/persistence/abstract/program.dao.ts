import { ERRORS } from '../../constants/error.constants';
import Program from '../../models/abstract/program.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class ProgramDao extends GenericDao<Program> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.PROGRAM);
    }

    // Abstract Methods Signature Override
    public abstract create(universityId: string, internalId: string, name: string): Promise<Program>;
    public abstract modify(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Program>;
    public abstract delete(id: string, universityIdFilter: string): Promise<void>;
    
    public abstract findById(id: string, universityIdFilter?: string): Promise<Program | undefined>;
    public abstract findPaginated(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Program>>;
    
    // Abstract Methods
    public abstract addCourse(id: string, universityIdFilter: string, courseId: string, optional: boolean): Promise<void>;
    public abstract modifyCourse(id: string, universityIdFilter: string, courseId: string, optional: boolean): Promise<void>;
    public abstract removeCourse(id: string, universityIdFilter: string, courseId: string): Promise<void>;
    public abstract bulkAddCourses(id: string, universityIdFilter: string, mandatoryCoursesIds: string[], optionalCoursesIds: string[]): Promise<void>;
    public abstract bulkReplaceCourses(id: string, universityIdFilter: string, mandatoryCoursesIds: string[], optionalCoursesIds: string[]): Promise<void>;

    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string): Promise<Program> {
        return await super.getById(id, universityIdFilter);
    }
}
