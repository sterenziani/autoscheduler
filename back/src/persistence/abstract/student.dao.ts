import { ERRORS } from '../../constants/error.constants';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import { IStudentInfo } from '../../interfaces/student.interface';
import Student from '../../models/abstract/student.model';
import GenericDao from './generic.dao';

export default abstract class StudentDao extends GenericDao<Student> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.STUDENT);
    }

    // Abstract Methods Signature Override
    public abstract create(id: string, universityId: string, programId: string, name: string): Promise<Student>;
    public abstract modify(id: string, programId?: string, name?: string): Promise<Student>;

    public abstract findById(id: string, universityIdFilter?: string): Promise<Student | undefined>;
    public abstract findPaginated(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Student>>;

    // Abstract Methods
    public abstract getStudentInfo(id: string): Promise<IStudentInfo>;
    public abstract addCompletedCourse(id: string, universityIdFilter: string, courseId: string): Promise<void>;
    public abstract removeCompletedCourse(id: string, universityIdFilter: string, courseId: string): Promise<void>;
    public abstract bulkAddCompletedCourses(id: string, universityIdFilter: string, courseIds: string[]): Promise<void>;
    public abstract bulkReplaceCompletedCourses(id: string, universityIdFilter: string, courseIds: string[]): Promise<void>;

    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string): Promise<Student> {
        return await super.getById(id, universityIdFilter)
    }
}
