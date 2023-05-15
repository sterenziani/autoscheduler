export default class Time {
    // Properties
    hour: number; // Allowed values are 0 to 23
    minute: number; // Allowed values are 0 to 59

    // Constructor
    constructor(hour: number, minute: number) {
        // Time only takes integers, so we truncate
        hour = Math.trunc(hour);
        minute = Math.trunc(minute);

        // We validate numbers make sense for a time, otherwise we throw
        if (hour < 0 || hour > 23) throw new Error('Invalid hour, hour should be between 0 and 23.');
        if (minute < 0 || minute > 59) throw new Error('Invalid minute, minute should be between 0 and 59.');

        this.hour = hour;
        this.minute = minute;
    }

    // Methods
    /**
     * Returns positive number if this is greater than other
     * Returns negative number if this is lesser than other
     * Returns 0 if this is equal to other
     * @param other
     */
    compareTo(other: Time): number {
        let diff = this.hour - other.hour;
        if (diff == 0) diff = this.minute - other.minute;
        return diff;
    }
}
