import Student from '../models/abstract/student.model';
import Course from '../models/abstract/course.model';
import StudentDao from '../persistence/abstract/student.dao';
import StudentDaoFactory from '../factories/studentDao.factory';
import { ROLE } from '../constants/general.constants';
import CourseService from './course.service';
import ProgramService from './program.service';
import UserService from './user.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { paginateCollection } from '../helpers/collection.helper';

export default class StudentService {
    private static instance: StudentService;
    private courseService!: CourseService;
    private programService!: ProgramService;
    private userService!: UserService;

    private dao: StudentDao;

    static getInstance(): StudentService {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    }

    constructor() {
        this.dao = StudentDaoFactory.get();
    }

    init() {
        this.programService = ProgramService.getInstance();
        this.userService = UserService.getInstance();
        this.courseService = CourseService.getInstance();
    }

    // public methods

    async getStudent(id: string): Promise<Student> {
        return await this.dao.getById(id);
    }

    async getStudentCompletedCourses(studentId: string): Promise<Course[]> {
        const student = await this.dao.getById(studentId);
        return await student.getCompletedCourses();
    }

    async getStudentRemainingCoursesForProgram(
        studentId: string,
        programId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Course>>  {
        const student = await this.dao.getById(studentId);
        const finishedCourses = await student.getCompletedCourses();

        const program = await this.programService.getProgram(programId);
        const mandatoryCourses = await program.getMandatoryCourses();
        const optionalCourses = await program.getOptionalCourses();
        let courses = [...mandatoryCourses, ...optionalCourses];

        courses = courses.filter(c => !finishedCourses.includes(c) && (!text || c.name.toLowerCase().includes(text) || c.internalId.toLowerCase().includes(text)));
        const compareCourses = ((c1: Course, c2: Course) => c1.internalId.localeCompare(c2.internalId));
        return paginateCollection(courses, compareCourses, limit, offset);
    }

    async createStudent(
        email: string,
        password: string,
        universityId: string,
        programId: string,
        internalId: string,
        name: string,
    ): Promise<Student> {
        // validate params
        if (!internalId || !name) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
        const program = await this.programService.getProgram(programId);
        const university = await program.getUniversity();
        if (universityId != university.id) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);

        // create user
        const user = await this.userService.createUser(email, password, ROLE.STUDENT);
        // create student
        return await this.dao.create(user.id, universityId, programId, internalId, name);
    }

    async addStudentCompletedCourses(studentId: string, completedCourses: string[]): Promise<void> {
        const student = await this.dao.getById(studentId);
        const studentUniversity = await student.getUniversity();

        // validate existence of courses
        await Promise.all(
            completedCourses.map(async (cId) => {
                const course: Course = await this.courseService.getCourse(cId);
                const university = await course.getUniversity();
                if (university.id != studentUniversity.id) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
            }),
        );

        // TODO add session logic for transactional operations
        await Promise.all(
            completedCourses.map(async (cId) => {
                await student.addCompletedCourse(cId);
            }),
        );

        return;
    }

    async removeStudentCompletedCourses(studentId: string, completedCourses: string[]): Promise<void> {
        const student = await this.dao.getById(studentId);
        const studentUniversity = await student.getUniversity();

        // validate existence of courses
        await Promise.all(
            completedCourses.map(async (cId) => {
                const course: Course = await this.courseService.getCourse(cId);
                const university = await course.getUniversity();
                if (university.id != studentUniversity.id) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
            }),
        );

        // TODO add session logic for transactional operations
        await Promise.all(
            completedCourses.map(async (cId) => {
                await student.deleteCompletedCourse(cId);
            }),
        );

        return;
    }
}
