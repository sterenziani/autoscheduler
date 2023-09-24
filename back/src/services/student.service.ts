import Student from '../models/abstract/student.model';
import StudentDao from '../persistence/abstract/student.dao';
import StudentDaoFactory from '../factories/studentDao.factory';
import { ROLE } from '../constants/general.constants';
import UserService from './user.service';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { IStudentInfo } from '../interfaces/student.interface';
import EmailService from './email.service';

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

    async createStudentExistingUser(userId: string, userEmail: string, userLocale: string, universityId: string, programId: string, name: string, updateRole = true): Promise<Student> {
        // create student
        const student = await this.dao.create(userId, universityId, programId, name);
        // update user role (if neccesary)
        if (updateRole) {
            await this.userService.modifyUser(userId, undefined, undefined, undefined, ROLE.STUDENT);
        }
        // send welcome email
        this.emailService.sendStudentWelcomeEmail(userEmail, userLocale, student)
            .catch((err) => console.log(`[StudentService:createStudent] Failed to send student welcome email. ${JSON.stringify(err)}`));
        return student;
    }

    async createStudent(email: string, password: string, locale: string, universityId: string, programId: string, name: string): Promise<Student> {
        // create user
        const user = await this.userService.createUser(email, password, ROLE.STUDENT, locale);
        // create student
        return await this.createStudentExistingUser(user.id, user.email, user.locale, universityId, programId, name, false);
    }

    async modifyStudent(id: string, programId?: string, name?: string): Promise<Student> {
        return await this.dao.modify(id, programId, name);
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
