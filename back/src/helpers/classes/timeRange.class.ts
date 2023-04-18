import { DAY } from "../../constants/time.constants";
import Time from "./time.class";

export default class TimeRange {
    // Properties
    dayOfWeek: DAY;
    startTime: Time;
    endTime: Time;

    // Constructor
    constructor(dayOfWeek: DAY, startTime: Time, endTime: Time) {
        // We have to validate endTime is greater than startTime
        if (endTime.compareTo(startTime) <= 0) throw new Error('End time cannot be before or equal to start time.');

        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}