import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import StudentDao from '../persistence/abstract/student.dao';
import MemoryStudentDao from '../persistence/implementations/memory/memoryStudent.dao';
import GenericDaoFactory from './genericDao.factory';

export default class StudentDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): StudentDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryStudentDao.getInstance();
        }
    }
}
