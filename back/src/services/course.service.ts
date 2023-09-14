import CourseDaoFactory from '../factories/courseDao.factory';
import CourseDao from '../persistence/abstract/course.dao';
import Course from '../models/abstract/course.model';
import Program from '../models/abstract/program.model';
import ProgramService from './program.service';
import UniversityService from './university.service';
import CourseClassService from './courseClass.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class CourseService {
    private static instance: CourseService;
    private courseClassService!: CourseClassService;
    private programService!: ProgramService;
    private universityService!: UniversityService;

    private dao: CourseDao;

    static getInstance(): CourseService {
        if (!CourseService.instance) {
            CourseService.instance = new CourseService();
        }
        return CourseService.instance;
    }

    constructor() {
        this.dao = CourseDaoFactory.get();
    }

    init() {
        this.courseClassService = CourseClassService.getInstance();
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
                for(const cId of requiredCourses[pId]){
                    const course = await this.getCourse(cId);
                }
            }),
        );
        // check if a course with internalId already exists
        if (await this.dao.findByInternalId(universityId, internalId))
            throw new GenericException(ERRORS.BAD_REQUEST.COURSE_ALREADY_EXISTS);

        // TODO add session logic for transactional operations
        const course: Course = await this.dao.create(universityId, internalId, name);
        await course.setRequiredCourses(requiredCourses);
        return course;
    }

    async updateCourse(
        courseId: string,
        name: string,
        internalId: string,
        requiredCourses: { [programId: string]: string[] },
    ): Promise<Course> {
        // validate existence of course and programIds
        const course: Course = await this.getCourse(courseId);
        const courseUniversity = await course.getUniversity();
        await Promise.all(
            Object.keys(requiredCourses).map(async (pId) => {
                const program = await this.programService.getProgram(pId);
                const programUniversity = await program.getUniversity();
                if (programUniversity.id != courseUniversity.id) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);
            }),
        );

        // check if a course with new internalId already exists
        if (internalId != course.internalId) {
            const courseWithRequestedInternalId = await this.dao.findByInternalId(courseUniversity.id, internalId);
            if (courseWithRequestedInternalId && courseWithRequestedInternalId.id != course.id) {
                throw new GenericException(ERRORS.BAD_REQUEST.COURSE_ALREADY_EXISTS);
            }
        }
        course.internalId = internalId;
        course.name = name;
        await course.setRequiredCourses(requiredCourses);
        await this.dao.set(course);
        return course;
    }

    async deleteCourse(id: string) {
        await this.courseClassService.deleteCourseClassesForCourse(id);
        await this.dao.delete(id);
    }

    async getCoursesByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Course>> {
        return await this.dao.getByText(universityId, text, limit, offset);
    }

    async getProgramsWithRequiredCourses(courseId: string): Promise<Program[]> {
        const course = await this.getCourse(courseId);
        return await course.getProgramsWithRequiredCourses();
    }

    async getCourseRequirementsForProgram(courseId: string, programId: string): Promise<Course[]> {
        const course = await this.getCourse(courseId);
        await this.programService.getProgram(programId);
        return await course.getRequiredCoursesForProgram(programId);
    }
}
