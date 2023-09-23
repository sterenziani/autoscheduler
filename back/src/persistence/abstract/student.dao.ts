import { ERRORS } from '../../constants/error.constants';
import { IStudentInfo } from '../../interfaces/student.interface';
import Student from '../../models/abstract/student.model';
import GenericDao from './generic.dao';

export default abstract class StudentDao extends GenericDao<Student> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.STUDENT);
    }

    // Abstract Methods
    public abstract create(studentId: string, programId: string,name: string): Promise<Student>;
    public abstract getStudentInfo(studentId: string): Promise<IStudentInfo>;
}
