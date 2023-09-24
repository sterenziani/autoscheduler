import GenericModel from './generic.model';

export default abstract class Building extends GenericModel {
    // Properties
    internalId: string; // Internal id given by the university on creation
    name: string; // Name of the building

    // I made a second object so we can tell apart undefined from it not being set from undefined of the distance
    private distancesCache: {[distancedBuildingId: string]: {distance: number | undefined}} = {};

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
    }

    // Abstract Methods
    public abstract getDistanceInMinutesTo(other: Building): Promise<number | undefined>;

    // Methods
    public getDistanceFromCache(other: Building): {distance: number | undefined} | undefined {
        if (this.distancesCache[other.id] !== undefined) return this.distancesCache[other.id];
    }
    public saveDistanceToCache(other: Building, distance?: number): void {
        this.distancesCache[other.id] = {distance};
    }
}
