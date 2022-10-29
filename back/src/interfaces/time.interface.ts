import { DAY } from '../constants/general.constants';

export interface TimeRange {
    dayOfWeek: DAY;
    startTime: string;
    endTime: string;
}
