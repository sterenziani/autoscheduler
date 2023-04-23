import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import { addChildToParent } from "../../../helpers/persistence/memoryPersistence.helper";
import Building from "../../../models/abstract/building.model";
import MemoryBuilding from "../../../models/implementations/memory/memoryBuilding.model";
import BuildingDao from "../../abstract/building.dao";
import {v4 as uuidv4} from "uuid";
import MemoryUniversityDao from "./memoryUniversity.dao";

export default class MemoryBuildingDao extends BuildingDao {
    private static instance: BuildingDao;

    static getInstance = () => {
        if (!MemoryBuildingDao.instance) {
            MemoryBuildingDao.instance = new MemoryBuildingDao();
        }
        return MemoryBuildingDao.instance;
    }

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

    public async set(building: Building): Promise<void> {
        await this.getById(building.id);

        if (!(building instanceof MemoryBuilding))
            building = new MemoryBuilding(building.id, building.internalId, building.name);

        MEMORY_DATABASE.buildings.set(building.id, building);
    }
}