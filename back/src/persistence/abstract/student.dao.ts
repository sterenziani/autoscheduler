import { ERRORS } from '../../constants/error.constants';
import Student from '../../models/abstract/student.model';
import GenericDao from './generic.dao';

export default abstract class StudentDao extends GenericDao<Student> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.STUDENT);
    }

    // Abstract Methods
    public abstract create(
        userId: string,
        programId: string,
        name: string,
    ): Promise<Student>;
}
