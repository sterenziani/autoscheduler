import ProgramDao from '../persistence/abstract/program.dao';
import ProgramDaoFactory from '../factories/programDao.factory';
import Program from '../models/abstract/program.model';
import CourseService from './course.service';
import UniversityService from './university.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export default class ProgramService {
    private static instance: ProgramService;
    private courseService!: CourseService;
    private universityService!: UniversityService;

    private dao: ProgramDao;

    static getInstance = (): ProgramService => {
        if (!ProgramService.instance) {
            ProgramService.instance = new ProgramService();
        }
        return ProgramService.instance;
    };

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
        const differentCourseIds: Set<string> = new Set();
        for (const courseId of mandatoryCourses.concat(optionalCourses)) {
            if (differentCourseIds.has(courseId)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
            differentCourseIds.add(courseId);
        }
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
            Promise.all(mandatoryCourses.map(async (cId) => program.addCourse(cId, false))),
            Promise.all(optionalCourses.map(async (cId) => program.addCourse(cId, true))),
        ]);

        return program;
    }
}
