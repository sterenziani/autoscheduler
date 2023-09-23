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

    // async updateProgram(
    //     programId: string,
    //     internalId: string,
    //     name: string,
    //     mandatoryCourses: string[] = [],
    //     optionalCourses: string[] = [],
    // ): Promise<Program> {
    //     // validate existence of course and programIds
    //     const program: Program = await this.getProgram(programId);
    //     const programUniversity = await program.getUniversity();
    //     await Promise.all(
    //         mandatoryCourses.concat(optionalCourses).map(async (cId) => {
    //             const course = await this.courseService.getCourse(cId);
    //             const university = await course.getUniversity();
    //             if (university.id != programUniversity.id) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
    //         }),
    //     );

    //     // check if a program with new internalId already exists
    //     if (internalId != program.internalId) {
    //         const programWithRequestedInternalId = await this.dao.findByInternalId(programUniversity.id, internalId);
    //         if (programWithRequestedInternalId && programWithRequestedInternalId.id != program.id) {
    //             throw new GenericException(ERRORS.BAD_REQUEST.PROGRAM_ALREADY_EXISTS);
    //         }
    //     }

    //     program.internalId = internalId;
    //     program.name = name;
    //     await program.setMandatoryCourses(mandatoryCourses);
    //     await program.setOptionalCourses(optionalCourses);
    //     await this.dao.set(program);
    //     return program;
    // }

    // async getProgramsByText(
    //     universityId: string,
    //     text?: string,
    //     limit?: number,
    //     offset?: number,
    // ): Promise<PaginatedCollection<Program>> {
    //     return await this.dao.findByText(universityId, text, limit, offset);
    // }

    // async getProgramMandatoryCourses(
    //     id: string,
    //     limit?: number,
    //     offset?: number,
    // ): Promise<PaginatedCollection<Course>> {
    //     const program = await this.dao.getById(id);
    //     if (!program) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);

    //     const mandatoryCourses = await program.getMandatoryCourses();
    //     const compareCourses = ((c1: Course, c2: Course) => c1.internalId.localeCompare(c2.internalId));
    //     return paginateCollection(mandatoryCourses, compareCourses);
    // }

    // async getProgramOptionalCourses(id: string, limit?: number, offset?: number): Promise<PaginatedCollection<Course>> {
    //     const program = await this.dao.getById(id);
    //     if (!program) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);

    //     const optionalCourses = await program.getOptionalCourses();
    //     const compareCourses = ((c1: Course, c2: Course) => c1.internalId.localeCompare(c2.internalId));
    //     return paginateCollection(optionalCourses, compareCourses);
    // }
}
