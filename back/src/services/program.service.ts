import ProgramDao from '../persistence/abstract/program.dao';
import ProgramDaoFactory from '../factories/programDao.factory';
import Program from '../models/abstract/program.model';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class ProgramService {
    private static instance: ProgramService;

    private dao: ProgramDao;

    static getInstance(): ProgramService {
        if (!ProgramService.instance) {
            ProgramService.instance = new ProgramService();
        }
        return ProgramService.instance;
    }

    constructor() {
        this.dao = ProgramDaoFactory.get();
    }

    init() {
        // Do nothing
    }

    // public methods

    async getProgram(id: string, universityIdFilter?: string): Promise<Program> {
        return await this.dao.getById(id, universityIdFilter);
    }

    async getPrograms(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Program>> {
        return await this.dao.findPaginated(page, limit, textSearch, universityId);
    }

    async createProgram(universityId: string, internalId: string, name: string): Promise<Program> {
        return await this.dao.create(universityId, internalId, name);
    }

    async modifyProgram(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Program> {
        return await this.dao.modify(id, universityIdFilter, internalId, name);
    }

    async deleteProgram(id: string, universityIdFilter: string): Promise<void> {
        await this.dao.delete(id, universityIdFilter);
    }

    async addCourse(id: string, universityIdFilter: string, courseId: string, optional: boolean): Promise<void> {
        await this.dao.addCourse(id, universityIdFilter, courseId, optional);
    }

    async modifyCourse(id: string, universityIdFilter: string, courseId: string, optional: boolean): Promise<void> {
        await this.dao.modifyCourse(id, universityIdFilter, courseId, optional);
    }

    async removeCourse(id: string, universityIdFilter: string, courseId: string): Promise<void> {
        await this.dao.removeCourse(id, universityIdFilter, courseId);
    }

    async bulkAddCourses(id: string, universityIdFilter: string, mandatoryCoursesIds: string[], optionalCoursesIds: string[]): Promise<void> {
        await this.dao.bulkAddCourses(id, universityIdFilter, mandatoryCoursesIds, optionalCoursesIds);
    }

    async bulkReplaceCourses(id: string, universityIdFilter: string, mandatoryCoursesIds: string[], optionalCoursesIds: string[]): Promise<void> {
        await this.dao.bulkReplaceCourses(id, universityIdFilter, mandatoryCoursesIds, optionalCoursesIds);
    }

    async addCourseRequiredCourse(id: string, universityIdFilter: string, courseId: string, requiredCourseId: string): Promise<void> {
        await this.dao.addCourseRequiredCourse(id, universityIdFilter, courseId, requiredCourseId);
    }

    async removeCourseRequiredCourse(id: string, universityIdFilter: string, courseId: string, requiredCourseId: string): Promise<void> {
        await this.dao.removeCourseRequiredCourse(id, universityIdFilter, courseId, requiredCourseId);
    }

    async bulkAddCourseRequiredCourses(id: string, universityIdFilter: string, courseId: string, requirements: string[]): Promise<void> {
        await this.dao.bulkAddCourseRequiredCourses(id, universityIdFilter, courseId, requirements);
    }

    async bulkReplaceCourseRequiredCourses(id: string, universityIdFilter: string, courseId: string, requirements: string[]): Promise<void> {
        await this.dao.bulkReplaceCourseRequiredCourses(id, universityIdFilter, courseId, requirements);
    }
}
