import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { addChildToParent, getChildsFromParent } from '../../../helpers/persistence/memoryPersistence.helper';
import Building from '../../../models/abstract/building.model';
import MemoryBuilding from '../../../models/implementations/memory/memoryBuilding.model';
import BuildingDao from '../../abstract/building.dao';
import { v4 as uuidv4 } from 'uuid';
import MemoryUniversityDao from './memoryUniversity.dao';

export default class MemoryBuildingDao extends BuildingDao {
    private static instance: BuildingDao;

    static getInstance = () => {
        if (!MemoryBuildingDao.instance) {
            MemoryBuildingDao.instance = new MemoryBuildingDao();
        }
        return MemoryBuildingDao.instance;
    };

    // Abstract Methods Implementations
    public async create(universityId: string, internalId: string, name: string): Promise<Building> {
        // We get the university to check that it exists
        const university = await MemoryUniversityDao.getInstance().getById(universityId);
        const newBuilding = new MemoryBuilding(uuidv4(), internalId, name);

        MEMORY_DATABASE.buildings.set(newBuilding.id, newBuilding);
        addChildToParent(MEMORY_DATABASE.buildingsOfUniversity, university.id, newBuilding.id);

        return newBuilding;
    }

    public async findById(id: string): Promise<Building | undefined> {
        return MEMORY_DATABASE.buildings.get(id);
    }

    public async findByUniversityId(universityId: string): Promise<Building[]> {
        return getChildsFromParent(MEMORY_DATABASE.buildingsOfUniversity, MEMORY_DATABASE.buildings, universityId);
    }

    public async findByInternalId(universityId: string, internalId: string): Promise<Building[]> {
        return (await this.findByUniversityId(universityId)).filter((b) => b.internalId === internalId);
    }

    public async set(building: Building): Promise<void> {
        await this.getById(building.id);

        if (!(building instanceof MemoryBuilding))
            building = new MemoryBuilding(building.id, building.internalId, building.name);

        MEMORY_DATABASE.buildings.set(building.id, building);
    }

    public async getUniversityBuildingsByText(universityId: string, text?: string): Promise<Building[]> {
        text = text ? text.toLowerCase() : text;
        let universityBuildings: Building[] = await this.findByUniversityId(universityId);
        if (text) {
            universityBuildings = universityBuildings.filter(
                (b) => b.name.toLowerCase().includes(text!) || b.internalId.toLowerCase().includes(text!),
            );
        }

        return universityBuildings;
    }

    public async deleteBuilding(id: string) {
        MEMORY_DATABASE.buildings.delete(id);
    }
}
