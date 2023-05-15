import { ERRORS } from '../../constants/error.constants';
import Building from '../../models/abstract/building.model';
import GenericDao from './generic.dao';

export default abstract class BuildingDao extends GenericDao<Building> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.BUILDING);
    }

    // Abstract Methods
    public abstract create(universityId: string, internalId: string, name: string): Promise<Building>;
}
