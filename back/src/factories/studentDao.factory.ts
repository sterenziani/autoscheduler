import StudentDao from '../persistence/abstract/student.dao';

export default class StudentDaoFactory {
    // Static Getters
    public static get(): StudentDao {
        throw new Error('Not Implemented');
    }
}
