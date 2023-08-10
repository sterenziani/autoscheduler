import CourseDaoFactory from '../factories/courseDao.factory';
import CourseDao from '../persistence/abstract/course.dao';
import Course from '../models/abstract/course.model';
import ProgramService from './program.service';
import UniversityService from './university.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class CourseService {
    private static instance: CourseService;
    private programService!: ProgramService;
    private universityService!: UniversityService;

    private dao: CourseDao;

    static getInstance = (): CourseService => {
        if (!CourseService.instance) {
            CourseService.instance = new CourseService();
        }
        return CourseService.instance;
    };

    constructor() {
        this.dao = CourseDaoFactory.get();
    }

    init() {
        this.programService = ProgramService.getInstance();
        this.universityService = UniversityService.getInstance();
    }

    // public methods

    async getCourse(id: string): Promise<Course> {
        return await this.dao.getById(id);
    }

    async findCourseByInternalId(universityId: string, internalId: string): Promise<Course> {
        const course = await this.dao.findByInternalId(universityId, internalId);
        if (!course) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
        return course;
    }

    async createCourse(
        universityId: string,
        name: string,
        internalId: string,
        requiredCourses: { [programId: string]: string[] },
    ): Promise<Course> {
        // validate existence of university & programId
        await this.universityService.getUniversity(universityId);
        await Promise.all(
            Object.keys(requiredCourses).map(async (pId) => {
                const program = await this.programService.getProgram(pId);
                const university = await program.getUniversity();
                if (university.id != universityId) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);
            }),
        );
        // check if a course with internalId already exists
        if (await this.dao.findByInternalId(universityId, internalId))
            throw new GenericException(ERRORS.BAD_REQUEST.COURSE_ALREADY_EXISTS);

        // TODO add session logic for transactional operations
        const course: Course = await this.dao.create(universityId, internalId, name);
        for (const programId of Object.keys(requiredCourses)) {
            for (const courseId of requiredCourses[programId]) {
                await course.setRequiredCourse(programId, courseId);
            }
        }
        return course;
    }

    async getCoursesByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Course>> {
        return await this.dao.getByText(universityId, text, limit, offset);
    }
}
