import BuildingDao from '../persistence/abstract/building.dao';
import BuildingDaoFactory from '../factories/buildingDao.factory';
import Building from '../models/abstract/building.model';
import { IBuildingDistance, IBuildingDistancesInput } from '../interfaces/building.interface';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { cleanMaybeText } from '../helpers/string.helper';

export default class BuildingService {
    private static instance: BuildingService;

    private dao: BuildingDao;

    static getInstance(): BuildingService {
        if (!BuildingService.instance) {
            BuildingService.instance = new BuildingService();
        }
        return BuildingService.instance;
    }

    constructor() {
        this.dao = BuildingDaoFactory.get();
    }

    init() {
        // Do nothing
    }

    // public methods

    async getBuilding(id: string, universityIdFilter?: string): Promise<Building> {
        return await this.dao.getById(id, universityIdFilter);
    }

    async getBuildings(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Building>> {
        return await this.dao.findPaginated(page, limit, cleanMaybeText(textSearch), universityId);
    }

    async createBuilding(universityId: string, internalId: string, name: string): Promise<Building> {
        return await this.dao.create(universityId, internalId, name);
    }

    async modifyBuilding(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Building> {
        return await this.dao.modify(id, universityIdFilter, internalId, name);
    }

    async deleteBuilding(id: string, universityIdFilter: string): Promise<void> {
        return await this.dao.delete(id, universityIdFilter);
    }

    async getDistance(id: string, universityIdFilter: string, distancedBuildingId: string): Promise<IBuildingDistance> {
        return await this.dao.getDistance(id, universityIdFilter, distancedBuildingId);
    }

    async getDistances(id: string, universityIdFilter: string): Promise<IBuildingDistance[]> {
        return await this.dao.findDistances(id, universityIdFilter);
    }

    async addDistance(id: string, universityIdFilter: string, distancedBuildingId: string, distance: number): Promise<IBuildingDistance> {
        return await this.dao.addDistance(id, universityIdFilter, distancedBuildingId, distance);
    }

    async modifyDistance(id: string, universityIdFilter: string, distancedBuildingId: string, distance: number): Promise<IBuildingDistance> {
        return await this.dao.modifyDistance(id, universityIdFilter, distancedBuildingId, distance);
    }

    async removeDistance(id: string, universityIdFilter: string, distancedBuildingId: string): Promise<void> {
        return await this.dao.removeDistance(id, universityIdFilter, distancedBuildingId);
    }

    async bulkAddDistances(id: string, universityIdFilter: string, distances: IBuildingDistancesInput): Promise<void> {
        return await this.dao.bulkAddDistances(id, universityIdFilter, distances);
    }

    async bulkReplaceDistances(id: string, universityIdFilter: string, distances: IBuildingDistancesInput): Promise<void> {
        return await this.dao.bulkReplaceDistances(id, universityIdFilter, distances);
    }
}
