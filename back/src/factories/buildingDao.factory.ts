import BuildingDao from '../persistence/abstract/building.dao';
import DatabaseBuildingDao from '../persistence/implementations/databaseBuilding.dao';

export default class BuildingDaoFactory {
    // Static Getters
    public static get(): BuildingDao {
        return DatabaseBuildingDao.getInstance();
    }
}
