import UniversityDao from '../persistence/abstract/university.dao';
import DatabaseUniversityDao from '../persistence/implementations/databaseUniversity.dao';

export default class UniversityDaoFactory {
    // Static Getters
    public static get(): UniversityDao {
        return DatabaseUniversityDao.getInstance();
    }
}
