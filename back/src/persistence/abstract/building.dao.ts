import { ERRORS } from '../../constants/error.constants';
import Building from '../../models/abstract/building.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import { IBuildingDistance, IBuildingDistancesInput } from '../../interfaces/building.interface';
import GenericException from '../../exceptions/generic.exception';

export default abstract class BuildingDao extends GenericDao<Building> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.BUILDING);
    }

    // Abstract Methods Signature Override
    public abstract create(universityId: string, internalId: string, name: string): Promise<Building>;
    public abstract modify(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Building>;
    public abstract delete(id: string, universityIdFilter: string): Promise<void>;

    public abstract findById(id: string, universityidFilter?: string): Promise<Building | undefined>;
    public abstract findPaginated(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Building>>;

    // Abstract Methods
    public abstract findDistance(id: string, universityIdFilter: string, distancedBuildingId: string): Promise<IBuildingDistance | undefined>;
    public abstract findDistances(id: string, universityIdFilter: string): Promise<IBuildingDistance[]>;
    public abstract addDistance(id: string, universityIdFilter: string, distancedBuildingId: string, distance: number): Promise<IBuildingDistance>;
    public abstract modifyDistance(id: string, universityIdFilter: string, distancedBuildingId: string, distance: number): Promise<IBuildingDistance>;
    public abstract removeDistance(id: string, universityIdFilter: string, distancedBuildingId: string): Promise<void>;
    public abstract bulkAddDistances(id: string, universityIdFilter: string, distances: IBuildingDistancesInput): Promise<void>;        // TODO: I can easily return IBuildingDistance[] if we need it
    public abstract bulkReplaceDistances(id: string, universityIdFilter: string, distances: IBuildingDistancesInput): Promise<void>;    // TODO: I can easily return IBuildingDistance[] if we need it

    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string): Promise<Building> {
        return await super.getById(id, universityIdFilter);
    }

    // Public Methods
    public async getDistance(id: string, universityIdFilter: string, distancedBuildingId: string): Promise<IBuildingDistance> {
        const maybeDistance = await this.findDistance(id, universityIdFilter, distancedBuildingId);
        if (maybeDistance === undefined) throw new GenericException(ERRORS.NOT_FOUND.BUILDING_DISTANCE);
        return maybeDistance;
    }
}
