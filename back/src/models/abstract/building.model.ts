import GenericModel from './generic.model';

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

    // Abstract Methods
    public abstract getDistanceInMinutesTo(other: Building): Promise<number | undefined>;
}
