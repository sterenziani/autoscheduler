import ProgramDao from '../persistence/abstract/program.dao';
import ProgramDaoFactory from '../factories/programDao.factory';
import Program from '../models/abstract/program.model';
import CourseService from './course.service';
import UniversityService from './university.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { paginateCollection } from '../helpers/collection.helper';
import Course from '../models/abstract/course.model';

export default class ProgramService {
    private static instance: ProgramService;
    private courseService!: CourseService;
    private universityService!: UniversityService;

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
        this.courseService = CourseService.getInstance();
        this.universityService = UniversityService.getInstance();
    }

    async getProgram(id: string): Promise<Program> {
        return await this.dao.getById(id);
    }

    async createProgram(
        universityId: string,
        internalId: string,
        name: string,
        mandatoryCourses: string[] = [],
        optionalCourses: string[] = [],
    ): Promise<Program> {
        // validate existence of university & courses
        await this.universityService.getUniversity(universityId);
        await Promise.all(
            mandatoryCourses.concat(optionalCourses).map(async (cId) => {
                const course = await this.courseService.getCourse(cId);
                const university = await course.getUniversity();
                if (university.id != universityId) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
            }),
        );
        // check if a program with internalId already exists
        if (await this.dao.findByInternalId(universityId, internalId))
            throw new GenericException(ERRORS.BAD_REQUEST.PROGRAM_ALREADY_EXISTS);

        // TODO add session logic for transactional operations
        const program = await this.dao.create(universityId, internalId, name);
        await Promise.all([
            Promise.all(mandatoryCourses.map(async (cId) => await program.addCourse(cId, false))),
            Promise.all(optionalCourses.map(async (cId) => await program.addCourse(cId, true))),
        ]);

        return program;
    }

    async updateProgram(
        programId: string,
        internalId: string,
        name: string,
        mandatoryCourses: string[] = [],
        optionalCourses: string[] = [],
    ): Promise<Program> {
        // validate existence of course and programIds
        const program: Program = await this.getProgram(programId);
        const programUniversity = await program.getUniversity();
        await Promise.all(
            mandatoryCourses.concat(optionalCourses).map(async (cId) => {
                const course = await this.courseService.getCourse(cId);
                const university = await course.getUniversity();
                if (university.id != programUniversity.id) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
            }),
        );

        // check if a program with new internalId already exists
        if (internalId != program.internalId) {
            const programWithRequestedInternalId = await this.dao.findByInternalId(programUniversity.id, internalId);
            if (programWithRequestedInternalId && programWithRequestedInternalId.id != program.id) {
                throw new GenericException(ERRORS.BAD_REQUEST.PROGRAM_ALREADY_EXISTS);
            }
        }

        program.internalId = internalId;
        program.name = name;
        await program.setMandatoryCourses(mandatoryCourses);
        await program.setOptionalCourses(optionalCourses);
        await this.dao.set(program);
        return program;
    }

    async getProgramsByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Program>> {
        return await this.dao.findByText(universityId, text, limit, offset);
    }

    async getProgramMandatoryCourses(
        id: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Course>> {
        const program = await this.dao.getById(id);
        if (!program) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);

        const mandatoryCourses = await program.getMandatoryCourses();
        const compareCourses = ((c1: Course, c2: Course) => c1.internalId.localeCompare(c2.internalId));
        return paginateCollection(mandatoryCourses, compareCourses);
    }

    async getProgramOptionalCourses(id: string, limit?: number, offset?: number): Promise<PaginatedCollection<Course>> {
        const program = await this.dao.getById(id);
        if (!program) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);

        const optionalCourses = await program.getOptionalCourses();
        const compareCourses = ((c1: Course, c2: Course) => c1.internalId.localeCompare(c2.internalId));
        return paginateCollection(optionalCourses, compareCourses);
    }
}
