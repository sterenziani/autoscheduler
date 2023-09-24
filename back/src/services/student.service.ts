import Student from '../models/abstract/student.model';
import StudentDao from '../persistence/abstract/student.dao';
import StudentDaoFactory from '../factories/studentDao.factory';
import { ROLE } from '../constants/general.constants';
import UserService from './user.service';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { IStudentInfo } from '../interfaces/student.interface';
import EmailService from './email.service';
import { mapStudentProgram } from '../helpers/auth.helper';

export default class StudentService {
    private static instance: StudentService;
    private userService!: UserService;
    private emailService!: EmailService;

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
        this.userService = UserService.getInstance();
        this.emailService = EmailService.getInstance();
    }

    // public methods

    async getStudent(id: string, universityIdFilter?: string): Promise<Student> {
        return await this.dao.getById(id, universityIdFilter);
    }

    async getStudents(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Student>> {
        return await this.dao.findPaginated(page, limit, textSearch, universityId);
    }

    async createStudent(email: string, password: string, locale: string, universityId: string, programId: string, name: string): Promise<Student> {
        // create user
        const user = await this.userService.createUser(email, password, locale, ROLE.STUDENT);
        // create student
        const student = await this.dao.create(user.id, universityId, programId, name);
        // send welcome email
        this.emailService.sendStudentWelcomeEmail(user.email, user.locale, student)
            .catch((err) => console.log(`[StudentService:createStudent] Failed to send student welcome email. ${JSON.stringify(err)}`));
        return student;
    }

    async modifyStudent(id: string, programId?: string, name?: string): Promise<Student> {
        const student = await this.dao.modify(id, programId, name);
        if (programId !== undefined) mapStudentProgram(id, programId);
        return student;
    }

    async getStudentInfo(id: string): Promise<IStudentInfo> {
        return await this.dao.getStudentInfo(id);
    }

    async addCompletedCourse(id: string, universityIdFilter: string, courseId: string): Promise<void> {
        await this.dao.addCompletedCourse(id, universityIdFilter, courseId);
    }

    async removeCompletedCourse(id: string, universityIdFilter: string, courseId: string): Promise<void> {
        await this.dao.removeCompletedCourse(id, universityIdFilter, courseId);
    }

    async bulkAddCompletedCourses(id: string, universityIdFilter: string, courseIds: string[]): Promise<void> {
        await this.dao.bulkAddCompletedCourses(id, universityIdFilter, courseIds);
    }

    async bulkReplaceCompletedCourses(id: string, universityIdFilter: string, courseIds: string[]): Promise<void> {
        await this.dao.bulkReplaceCompletedCourses(id, universityIdFilter, courseIds);
    }
}
