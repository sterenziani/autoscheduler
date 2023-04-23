import Student from '../models/abstract/student.model';
import Course from '../models/abstract/course.model';
import StudentDao from '../persistence/abstract/student.dao';
import StudentDaoFactory from '../factories/studentDao.factory';

export default class StudentService {
    private static instance: StudentService;
    
    private dao: StudentDao;

    constructor() {
        this.dao = StudentDaoFactory.get();
    }

    static getInstance = (): StudentService => {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    };

    // public methods

    async getStudent(id: string): Promise<Student> {
        return await this.dao.getById(id);
    }

    async getStudentCompletedCourses(studentId: string): Promise<Course[]> {
        const student = await this.dao.getById(studentId);
        return await student.getCompletedCourses();
    }
}
