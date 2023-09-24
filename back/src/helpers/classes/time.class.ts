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

    // Static constructors
    /**
     * Creates a new Time object from a string in hh:mm format.
     * If string does not match format it returns undefined
     * @param timeString
     */
    static parseString(timeString: string): Time | undefined {
        const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeString)) return undefined;
        const [hour, minute]: number[] = timeString.split(':', 2).map((n) => parseInt(n));
        return new Time(hour, minute);
    }

    /**
     * Creates a new Time object from a string in hh:mm format
     * @param timeString
     */
    static fromString(timeString: string): Time {
        const maybeTime = Time.parseString(timeString);
        if (maybeTime === undefined) throw new Error('Invalid time format, timeString should have hh:mm format.');
        return maybeTime;
    }

    /**
     * Returns Time with max allowed value
     */
    static minValue(): Time {
        return new Time(0, 0);
    }

    /**
     * Returns Time with max allowed value
     */
    static maxValue(): Time {
        return new Time(23, 59);
    }

    // Methods
    /**
     * Returns positive number if this is greater than other
     * Returns negative number if this is lesser than other
     * Returns 0 if this is equal to other
     * @param other
     */
    compareTo(other: Time): number {
        return this.getValueInMinutes()-other.getValueInMinutes();
    }

    /**
     * returns time in string format
     * hh:mm
     */
    toString(): string {
        return `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`;
    }

    /**
     * returns time in minutes passed since midnight
     */
    getValueInMinutes(): number {
        return this.hour*60 + this.minute;
    }
}
