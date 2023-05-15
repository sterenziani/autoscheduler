import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import BuildingDao from '../persistence/abstract/building.dao';
import MemoryBuildingDao from '../persistence/implementations/memory/memoryBuilding.dao';
import GenericDaoFactory from './genericDao.factory';

export default class BuildingDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): BuildingDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryBuildingDao.getInstance();
        }
    }
}
