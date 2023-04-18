import University from "./university.model";

export default abstract class Building {
    // Properties
    id: string;             // Id of the building in our databases
    internalId: string;     // Internal id given by the university on creation
    name: string;           // Name of the building

    // Abstract class constructor
    protected constructor(id: string, internalId: string, name: string) {
        this.id = id;
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract setDistanceInMinutesTo(buildingId: string, distance: number): Promise<void>;
    public abstract getDistanceInMinutesTo(buildingId: string): Promise<number | undefined>;
    public abstract getUniversity(): Promise<University>;
}