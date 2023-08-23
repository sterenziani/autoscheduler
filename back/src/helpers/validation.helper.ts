import TimeRange from './classes/timeRange.class';
import { DAY } from '../constants/time.constants';
import Time from './classes/time.class';
import { ILecture } from '../interfaces/courseClass.interface';

export const validateString = (data: any, maxLength?: number): string | undefined => {
    const maybeString = data === undefined || typeof data !== 'string' || data === '' ? undefined : (data as string);
    if (maybeString === undefined) return undefined;

    return maxLength ? (maybeString.length <= maxLength ? maybeString : undefined) : maybeString;
};

export const validateEnum = <T>(data: any, enumObject: any): T | undefined => {
    if (data === undefined) return undefined;
    for (const k in enumObject) {
        if (!isNaN(Number(k))) continue;
        if (enumObject[k] === data) return data as T;
    }

    return undefined;
};

export const validateArray = <T>(data: any, memberValidator: (data: any) => T | undefined): T[] | undefined => {
    if (data == undefined) return undefined;
    let isValid = Array.isArray(data);
    if (isValid) {
        for (const member of data) {
            const maybeMember = memberValidator(member);
            if (maybeMember === undefined) {
                isValid = false;
                break;
            }
        }
    }
    if (isValid) return data as T[];
    return undefined;
};

export const validateLecture = (maybeLecture: any): ILecture | undefined => {
    try {
        const buildingId = validateString(maybeLecture?.buildingId);
        if (buildingId === undefined) return undefined;

        const day = validateEnum<DAY>(maybeLecture?.day, DAY);
        if (day === undefined) return undefined;

        const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        const startTime = validateString(maybeLecture?.startTime);
        if (!timeRegex.test(startTime ?? '')) return undefined;
        const endTime = validateString(maybeLecture?.endTime);
        if (!timeRegex.test(endTime ?? '')) return undefined;

        const time = new TimeRange(day, Time.fromString(startTime!), Time.fromString(endTime!));
        return { buildingId, time };
    } catch (e) {
        return undefined;
    }
};
