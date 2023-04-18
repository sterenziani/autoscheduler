import IStudentMapper from '../mappers/interfaces/student.mapper';
import { Student } from '../models/student.interface';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import StudentMapperFactory from '../mappers/factories/studentMapper.factory';

export default class StudentService {
    private static instance: StudentService;
    
    private studentMapper: IStudentMapper;

    constructor() {
        this.studentMapper = StudentMapperFactory.get();
    }

    static getInstance = (): StudentService => {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    };

    // public methods

    async getStudent(id: string): Promise<Student> {
        const student: Student | null = await this.studentMapper.getStudentById(id);
        if (!student) throw new GenericException(ERRORS.NOT_FOUND.STUDENT);

        return student;
    }
}
