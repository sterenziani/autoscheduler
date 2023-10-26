import { DateTime, DateTimeJSOptions, Settings } from 'luxon';
import { ARG_TIMEZONE } from '../constants/time.constants';

Settings.defaultZone = ARG_TIMEZONE;

const opts: DateTimeJSOptions = {
    zone: ARG_TIMEZONE,
};

export const isValidISODate = (isoDate: string): boolean => {
    return DateTime.fromISO(isoDate).isValid;
};

export const getDateFromISO = (isoDate: string): Date => {
    return getDateTime(isoDate).toJSDate();
};

export const getDateTime = (date: Date | string): DateTime => {
    if (typeof date === 'string') {
        return DateTime.fromISO(date, opts);
    } else {
        return DateTime.fromJSDate(date, opts);
    }
};

export const getNowDateTime = (): DateTime => {
    return DateTime.now().setZone(ARG_TIMEZONE);
};

export const getDateISO = (date?: Date): string => {
    return (date ? DateTime.fromJSDate(date, opts).toISO() : getNowDateTime().toISO())!;
};

export const maybeDateToISO = (date?: Date): string | undefined => {
    return date ? getDateISO(date) : undefined;
}
