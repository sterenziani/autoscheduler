import { DAY } from '../../constants/time.constants';
import { validateEnum } from '../validation.helper';
import Time from './time.class';

const DAY_LENGTH_IN_MINUTES = 60*24;
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

    /**
     * Creates a new TimeRange object from a string in d-hh:mm-hh:mm format.
     * If string does not match format it returns undefined
     * @param timeString
     */
    static parseString(timeString: string): TimeRange | undefined {
        const splitTime = timeString.split('-');
        if (splitTime.length !== 3) return undefined;
        const maybeDay = splitTime[0];
        const maybeStartTime = splitTime[1];
        const maybeEndTime = splitTime[2];

        const day = validateEnum<DAY>(Number(maybeDay), DAY);
        if (day === undefined) return undefined;

        const startTime = Time.parseString(maybeStartTime);
        if (startTime === undefined) return undefined;

        const endTime = Time.parseString(maybeEndTime);
        if (endTime === undefined) return undefined;

        if (endTime.compareTo(startTime) <= 0) return undefined;

        return new TimeRange(day, startTime, endTime);
    }

    /**
     * Creates a new TimeRange object from a string in d-hh:mm-hh:mm format.
     * @param timeString
     */
    static fromString(timeString: string): TimeRange {
        const maybeTimeRange = TimeRange.parseString(timeString);
        if (maybeTimeRange === undefined) throw new Error('Invalid time range format, timeString should have d-hh:mm-hh:mm format with start time earlier than end time.');
        return maybeTimeRange;
    }

    // Methods
    /**
     * Returns positive number if this is greater than other
     * Returns negative number if this is lesser than other
     * Returns 0 if this is equal to other
     * @param other
     */
    compareTo(other: TimeRange): number {
        if(this.dayOfWeek === other.dayOfWeek){
            const startTimeDiff = this.startTime.compareTo(other.startTime);
            if(startTimeDiff !== 0)
                return startTimeDiff;
            return this.endTime.compareTo(other.endTime);
        };
        return this.dayOfWeek - other.dayOfWeek;
    }

    /**
     * returns timeRange in string format
     * d-hh:mm-hh:mm
     */
    toString(): string {
        return `${this.dayOfWeek}-${this.startTime.toString()}-${this.endTime.toString()}`;
    }

    /**
     * Returns true if there is overlap between the two time ranges, false otherwise.
     * @param other
     */
    overlaps(other: TimeRange): boolean {
        if (this.compareTo(other) === 0) return true;
        if (this.dayOfWeek === other.dayOfWeek) {
            const earliestAndSmallest = this.compareTo(other) < 0 ? this : other;
            const latestOrBiggest = this.compareTo(other) < 0 ? other : this;
            return earliestAndSmallest.endTime.compareTo(latestOrBiggest.startTime) > 0;
        }
        return false;
    }

    /**
     * Returns free minutes between the end of one timeRange and the other, or -1 if they overlap
     * Returned value will be the smallest gap possible, looping through consecutive weeks.
     * For example, between Monday and Friday there should be 3 days, not 4.
     * @param other
     */
    getGapInMinutesAgainst(other: TimeRange): number {
        if(this.overlaps(other)) return -1;

        const thisDay = this.dayOfWeek*DAY_LENGTH_IN_MINUTES;
        let thisStartMinute = thisDay + this.startTime.getValueInMinutes();
        let thisEndMinute = thisDay + this.endTime.getValueInMinutes();

        const otherDay = other.dayOfWeek*DAY_LENGTH_IN_MINUTES;
        let otherStartMinute = otherDay + other.startTime.getValueInMinutes();
        let otherEndMinute = otherDay + other.endTime.getValueInMinutes();

        if(thisEndMinute <= otherStartMinute)
            return Math.min(otherStartMinute-thisEndMinute, thisStartMinute+7*DAY_LENGTH_IN_MINUTES - otherEndMinute);

        if(otherEndMinute <= thisStartMinute)
            return Math.min(thisStartMinute-otherEndMinute, otherStartMinute+7*DAY_LENGTH_IN_MINUTES - thisEndMinute);
        return -1;
    }

    /**
     * Returns minutes between startTime and endTime
     */
    getDurationInMinutes(): number {
        return this.endTime.getValueInMinutes() - this.startTime.getValueInMinutes();
    }
}
