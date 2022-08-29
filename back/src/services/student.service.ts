import UserService from './user.service';
import IStudentMapper from '../mappers/interfaces/student.mapper';
import StudentMapperFactory from '../mappers/factories/studentMapper.factory';

class StudentService extends UserService {
    private static instance: StudentService;
    private studentMapper: IStudentMapper;

    constructor() {
        super(StudentMapperFactory.get());
        this.studentMapper = StudentMapperFactory.get();
    }

    static getInstance = (): StudentService => {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    };
}

export default StudentService;
