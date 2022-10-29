import { IStudent } from '../../models/student.model';

interface IStudentMapper {
    getStudentById(userId: string): Promise<IStudent | null>;
}

export default IStudentMapper;
