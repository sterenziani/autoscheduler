import TimeRange from "../../helpers/classes/timeRange.class";
import Building from "./building.model";
import CourseClass from "./courseClass.model";

export default abstract class Lecture {
    // Properties
    id: string;         // Id of the lecture in our databases
    time: TimeRange;    // The time range of the lecture

    // Abstract class constructor
    protected constructor(id: string, time: TimeRange) {
        this.id = id;
        this.time = time;
    }

    // Methods
    public abstract getBuilding(): Promise<Building>;
    public abstract getCourseClass(): Promise<CourseClass>;
}