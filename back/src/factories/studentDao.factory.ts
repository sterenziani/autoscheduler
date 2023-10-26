import StudentDao from '../persistence/abstract/student.dao';
import DatabaseStudentDao from '../persistence/implementations/databaseStudent.dao';

export default class StudentDaoFactory {
    // Static Getters
    public static get(): StudentDao {
        return DatabaseStudentDao.getInstance();
    }
}
