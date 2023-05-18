import Student from '../models/abstract/student.model';
import Course from '../models/abstract/course.model';
import StudentDao from '../persistence/abstract/student.dao';
import StudentDaoFactory from '../factories/studentDao.factory';
import { ROLE } from '../constants/general.constants';
import ProgramService from './program.service';
import UserService from './user.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export default class StudentService {
    private static instance: StudentService;
    private programService!: ProgramService;
    private userService!: UserService;

    private dao: StudentDao;

    static getInstance = (): StudentService => {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    };

    constructor() {
        this.dao = StudentDaoFactory.get();
    }

    init() {
        this.programService = ProgramService.getInstance();
        this.userService = UserService.getInstance();
    }

    // public methods

    async getStudent(id: string): Promise<Student> {
        return await this.dao.getById(id);
    }

    async getStudentCompletedCourses(studentId: string): Promise<Course[]> {
        const student = await this.dao.getById(studentId);
        return await student.getCompletedCourses();
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
}
