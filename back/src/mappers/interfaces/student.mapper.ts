import { Student } from '../../models/student.interface';

interface IStudentMapper {
    getStudentById(userId: string): Promise<Student | null>;
}

export default IStudentMapper;
