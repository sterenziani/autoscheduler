import TimeRange from '../../helpers/classes/timeRange.class';
import Building from './building.model';
import GenericModel from './generic.model';

export default abstract class Lecture extends GenericModel {
    // Properties
    time: TimeRange; // The time range of the lecture

    // Abstract class constructor
    constructor(id: string, time: TimeRange) {
        super(id);
        this.time = time;
    }

    // Methods
    public abstract getBuilding(): Promise<Building | undefined>;
}
