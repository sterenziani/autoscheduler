import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import UniversityDao from '../persistence/abstract/university.dao';
import DatabaseUniversityDao from '../persistence/implementations/database/databaseUniversity.dao';
import MemoryUniversityDao from '../persistence/implementations/memory/memoryUniversity.dao';
import GenericDaoFactory from './genericDao.factory';

export default class UniversityDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): UniversityDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                return DatabaseUniversityDao.getInstance();
            case PERSISTENCE.MEMORY:
                return MemoryUniversityDao.getInstance();
        }
    }
}
