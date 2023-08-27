import { ERRORS } from '../../constants/error.constants';
import Building from '../../models/abstract/building.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class BuildingDao extends GenericDao<Building> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.BUILDING);
    }

    // Abstract Methods
    public abstract create(universityId: string, internalId: string, name: string): Promise<Building>;
    public abstract findByUniversityId(universityId: string): Promise<Building[]>;
    public abstract findByInternalId(universityId: string, internalId: string): Promise<Building | undefined>;
    public abstract getUniversityBuildingsByText(universityId: string, text?: string, limit?: number, offset?: number): Promise<PaginatedCollection<Building>>;
    public abstract deleteBuilding(buildingId: string): Promise<void>;
}
