import TimeRange from '../../helpers/classes/timeRange.class';
import Building from './building.model';
import GenericModel from './generic.model';

export default abstract class Lecture extends GenericModel {
    // Properties
    time: TimeRange; // The time range of the lecture
    // Populated
    buildingId: string;

    // Abstract class constructor
    constructor(id: string, time: TimeRange, buildingId: string) {
        super(id);
        this.time = time;
        this.buildingId = buildingId;
    }

    // Methods
    public abstract getBuilding(): Promise<Building | undefined>;
}
