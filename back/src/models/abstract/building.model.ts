import GenericModel from './generic.model';
import University from './university.model';

export default abstract class Building extends GenericModel {
    // Properties
    internalId: string; // Internal id given by the university on creation
    name: string; // Name of the building

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract setDistanceInMinutesTo(buildingId: string, distance: number): Promise<void>;
    public abstract getDistanceInMinutesTo(buildingId: string): Promise<number | undefined>;
    public abstract getUniversity(): Promise<University>;
}
