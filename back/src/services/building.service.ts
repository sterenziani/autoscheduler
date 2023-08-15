import BuildingDao from '../persistence/abstract/building.dao';
import BuildingDaoFactory from '../factories/buildingDao.factory';
import Building from '../models/abstract/building.model';
import UniversityService from './university.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { IDistanceToBuilding } from '../interfaces/building.interface';

export default class BuildingService {
    private static instance: BuildingService;
    private universityService!: UniversityService;

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
        this.universityService = UniversityService.getInstance();
    }

    // public methods

    async getBuilding(id: string): Promise<Building> {
        return await this.dao.getById(id);
    }

    async getUniversityBuildingsByText(universityId: string, text?: string): Promise<Building[]> {
        return await this.dao.getUniversityBuildingsByText(universityId, text);
    }

    async getBuildingDistances(id: string): Promise<IDistanceToBuilding[]> {
        const building = await this.getBuilding(id);
        const buildingUniversity = await building.getUniversity();
        const universityBuildings = await this.getUniversityBuildingsByText(buildingUniversity.id);
        const distances: IDistanceToBuilding[] = [];

        for (const b of universityBuildings) {
            // skip if current building
            if (b.id === id) continue;

            const time = await building.getDistanceInMinutesTo(id);
            if (time) distances.push({ buildingId: b.id, time });
        }

        return distances;
    }

    async createBuilding(
        universityId: string,
        internalId: string,
        name: string,
        distances: { [internalId: string]: number } = {},
    ): Promise<Building> {
        // validate existence of university & buildings in distance
        await this.universityService.getUniversity(universityId);
        const differentBuildingIds: Set<string> = new Set();
        for (const buildingId of Object.keys(distances)) {
            if (differentBuildingIds.has(buildingId)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
            differentBuildingIds.add(buildingId);
        }
        // check if a building with internalId already exists
        if (await this.dao.findByInternalId(universityId, internalId))
            throw new GenericException(ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        await Promise.all(
            Object.keys(distances).map(async (bId) => {
                const building = await this.dao.findByInternalId(universityId, bId);
                if (!building) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
            }),
        );

        // TODO add session logic for transactional operations
        const building = await this.dao.create(universityId, internalId, name);
        await Promise.all(
            Object.entries(distances).map(async ([buildingId, distance]) => {
                await building.setDistanceInMinutesTo(buildingId, distance);
            }),
        );

        return building;
    }

    async deleteBuilding(universityId: string, id: string) {
        const building = await this.getBuilding(id);
        const buildingUniversity = await building.getUniversity();

        // check if university owns building
        if (buildingUniversity.id !== universityId) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        const universityBuildings = await this.getUniversityBuildingsByText(buildingUniversity.id);

        // TODO add session logic for transactional operations
        await this.dao.deleteBuilding(id);
        await Promise.all(
            universityBuildings.map(async (b) => {
                await building.deleteDistanceInMinutesTo(b.id);
            }),
        );
    }
}