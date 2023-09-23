import BuildingDao from '../persistence/abstract/building.dao';
import BuildingDaoFactory from '../factories/buildingDao.factory';
import Building from '../models/abstract/building.model';
import UniversityService from './university.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { IDistanceToBuilding } from '../interfaces/building.interface';
import { PaginatedCollection } from '../interfaces/paging.interface';

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

    async getUniversityBuildingsByText(universityId: string, limit: number, offset: number, text?: string): Promise<PaginatedCollection<Building>> {
        return await this.dao.getUniversityBuildingsByText(universityId, limit, offset, text);
    }

    async getBuildingDistances(id: string): Promise<IDistanceToBuilding[]> {
        const building = await this.getBuilding(id);
        const buildingUniversity = await building.getUniversity();
        const universityBuildings = await buildingUniversity.getBuildings();
        const distances: IDistanceToBuilding[] = [];

        for (const b of universityBuildings) {
            // skip if current building
            if (b.id === id) continue;

            const time = await building.getDistanceInMinutesTo(b.id);
            distances.push({ buildingId: b.id, time: time ? time : 0 });
        }

        distances.sort((a,b) => a.time-b.time);
        return distances;
    }

    async createBuilding(
        universityId: string,
        internalId: string,
        name: string,
        distances: { [buildingId: string]: number } = {},
    ): Promise<Building> {
        // validate existence of university & buildings in distance
        await this.universityService.getUniversity(universityId);

        // check if a building with internalId already exists
        if (await this.dao.findByInternalId(universityId, internalId))
            throw new GenericException(ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        await Promise.all(
            Object.keys(distances).map(async (bId) => {
                const building = await this.dao.findById(bId);
                if (!building) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
            }),
        );

        // TODO add session logic for transactional operations
        const building = await this.dao.create(universityId, internalId, name);
        await Promise.all(
            Object.entries(distances).map(async ([otherBuildingId, distance]) => {
                const otherBuilding: Building = await this.getBuilding(otherBuildingId);
                await building.setDistanceInMinutesTo(otherBuildingId, distance);
                await otherBuilding.setDistanceInMinutesTo(building.id, distance);
            }),
        );

        return building;
    }

    async updateBuilding(
        buildingId: string,
        internalId: string,
        name: string,
        distances: { [buildingId: string]: number } = {},
    ): Promise<Building> {
        // validate existence of building and programIds
        const building: Building = await this.getBuilding(buildingId);
        const buildingUniversity = await building.getUniversity();

        // check if a building with new internalId already exists
        if (internalId != building.internalId) {
            const buildingWithRequestedInternalId = await this.dao.findByInternalId(buildingUniversity.id, internalId);
            if (buildingWithRequestedInternalId && buildingWithRequestedInternalId.id != building.id) {
                throw new GenericException(ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
            }
        }
        building.internalId = internalId;
        building.name = name;
        await Promise.all(
            Object.entries(distances).map(async ([otherBuildingId, distance]) => {
                const otherBuilding: Building = await this.getBuilding(otherBuildingId);
                await building.setDistanceInMinutesTo(otherBuildingId, distance);
                await otherBuilding.setDistanceInMinutesTo(buildingId, distance);
            }),
        );
        await this.dao.set(building);
        return building;
    }

    async deleteBuilding(id: string) {
        const building = await this.getBuilding(id);
        const buildingUniversity = await building.getUniversity();
        const universityBuildings = await this.dao.findByUniversityId(buildingUniversity.id);

        // TODO add session logic for transactional operations
        await Promise.all(
            universityBuildings.map(async (b) => {
                await building.deleteDistanceInMinutesTo(b.id);
                await b.deleteDistanceInMinutesTo(building.id);
            }),
        );
        await this.dao.deleteBuilding(id);
    }
}
