import TimeRange from './classes/timeRange.class';
import { DAY } from '../constants/time.constants';
import Time from './classes/time.class';
import { IBuildingDistancesInput } from '../interfaces/building.interface';
import { getDateFromISO, isValidISODate } from './time.helper';
import { isValidText } from './string.helper';

// Parsing validators

export const validateString = (data: any, maxLength?: number): string | undefined => {
    const maybeString = data === undefined || typeof data !== 'string' || data === '' ? undefined : (data as string);
    if (maybeString === undefined) return undefined;

    return maxLength ? (maybeString.length <= maxLength ? maybeString : undefined) : maybeString;
};

export const validateNumber = (data: any): number | undefined => {
    if (data === undefined) return undefined;
    let maybeNumber: number | undefined = undefined;
    
    // For when type is number
    if (typeof data === 'number')
        maybeNumber = data as number;
    
    // For when type is string
    if (typeof data === 'string' && data !== '')
        maybeNumber = Number(data);
    
    // We make final check against NaN
    const num = (isNaN(maybeNumber ?? NaN)) ? undefined : maybeNumber as number;
    if (num && num < 0) return undefined;
    if (num === undefined) return undefined;
    
    return num;
};


export const validateNumberString = (data: any): string | undefined => {
    const maybeNumber = validateNumber(data);
    return maybeNumber?.toString();
};


export const validateInt = (data: any): number | undefined => {
    const maybeNumber = validateNumber(data);
    return (Number.isInteger(maybeNumber)) ? maybeNumber : undefined;
};


export const validateIntString = (data: any): string | undefined => {
    const maybeInt = validateInt(data);
    return maybeInt?.toString();
};

export const validateBoolean = (data: any): boolean | undefined => {
    if (data === undefined) return undefined;
    // For when type is boolean
    if (typeof data === 'boolean') return data as boolean;
    // For when type is string
    if (typeof data === 'string') {
        // For this we are going to make only 2 scenarios, one for "true" and "TRUE", then another for "false" and "FALSE"
        // Anything else is not considered a valid boolean and should return undefined
        const trimmedString: string = (data as string).toLowerCase().trim();
        if (trimmedString === 'true') return true;
        if (trimmedString === 'false') return false;
    }

    return undefined;
};

export const validateDate = (data: any): Date | undefined => {
    const dateString = validateString(data);
    if (dateString === undefined || !isValidISODate(dateString)) return undefined;
    return getDateFromISO(dateString);
};

export const validateEnum = <T>(data: any, enumObject: any): T | undefined => {
    if (data === undefined) return undefined;
    for (const k in enumObject) {
        if (!isNaN(Number(k))) continue;
        if (enumObject[k] === data) return data as T;
    }

    return undefined;
};

export const validateArray = <T>(data: any, memberValidator: (data: any, ...args: any[]) => T | undefined, ...memberValidatorArgs: any[]): T[] | undefined => {
    if (data == undefined) return undefined;
    let isValid = Array.isArray(data);
    if (isValid) {
        for (const member of data) {
            const maybeMember = memberValidator(member, ...memberValidatorArgs);
            if (maybeMember === undefined) {
                isValid = false;
                break;
            }
        }
    }
    if (isValid) return data as T[];
    return undefined;
};

export const validateElemOrElemArray = <T>(data: any, validator: (data: any, ...args: any[]) => T | undefined, ...validatorArgs: any[]): T[] | undefined => {
    if (data == undefined) return undefined;
    if (Array.isArray(data)) {
        return validateArray<T>(data, validator, ...validatorArgs);
    } else {
        const maybeValue = validator(data, ...validatorArgs);
        if (maybeValue === undefined) return undefined;
        return [maybeValue];
    }
};

export const validateLocale = (data: any): string | undefined => {
    const maybeLocale = validateString(data);
    if (maybeLocale === undefined || !isValidLocale(maybeLocale)) return undefined;
    return maybeLocale;
};

export const validateTimes = (data: any): TimeRange[] | undefined => {
    const timeStrings = validateElemOrElemArray(data, validateString);
    if (timeStrings === undefined) return undefined;
    const times: TimeRange[] = [];
    for (const timeString of timeStrings) {
        const maybeTimeRange = TimeRange.parseString(timeString);
        if (maybeTimeRange === undefined) return undefined;
        times.push(maybeTimeRange);
    }
    return times.sort((a, b) => a.compareTo(b));
};

export const validateBuildingDistances = (maybeDistances: any): IBuildingDistancesInput | undefined => {
    if (maybeDistances === undefined || typeof maybeDistances !== 'object') return undefined;
    for (const key of Object.keys(maybeDistances)) {
        const buildingId = validateString(key);
        if (buildingId === undefined) return undefined;
        const distance = validateInt(maybeDistances[key]);
        if (distance === undefined) return undefined;
    }
    return maybeDistances as IBuildingDistancesInput;
};

// IsValid Validators

export const isValidEmail = (email: string): boolean => {
    // simple regex check
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
    // password length check
    if (password.length < 8) return false;

    // at least one uppercase check
    if (!/[A-Z]/.test(password)) return false;

    // at least one lowercase check
    if (!/[a-z]/.test(password)) return false;

    // at least one number check
    if (!/[0-9]/.test(password)) return false;

    // passed all checks
    return true;
};

export const isValidLocale = (locale: string): boolean => {
    return true;    // TODO: Make the validator
};

export const isValidEnum = <T>(data: any, enumObject: any): boolean => {
    const maybeEnum = validateEnum<T>(data, enumObject);
    return maybeEnum !== undefined;
};

export const isValidInternalId = (internalId: string): boolean => {
    return internalId.length >= 1 && internalId.length <= 100;
};

export const isValidName = (name: string): boolean => {
    if (name.length < 3 || name.length > 80) return false;
    return isValidText(name);
};

export const isValidFilter = (filter?: string): boolean => {
    if (filter === undefined) return true;
    return isValidText(filter);
};

/**
 * Checks time ranges are not overlapping (things like ["0-10:00-20:00", "0-11:00-19:00"] or ["0-10:00-15:00", "0-14:00-18:00"])
 * Expects times to be sorted already
 * @param sortedTimes   sorted TimeRange array
 * @param allowEmpty    (Default: false) What it returns if array is empty
 */
export const isValidTimes = (sortedTimes: TimeRange[], allowEmpty = false): boolean => {
    if (sortedTimes.length === 0) return allowEmpty;
    if (sortedTimes.length === 1) return true;
    for (let i = 0; i < sortedTimes.length - 1; i++) {
        const current = sortedTimes[i];
        const next = sortedTimes[i + 1];
        if (current.overlaps(next)) return false;
    }
    return true;
};

export const isValidDay = (day: number): boolean => {
    const dayEnum = validateEnum<DAY>(day, DAY);
    return dayEnum !== undefined;
};

export const isValidTime = (timeString: string): boolean => {
    return Time.parseString(timeString) !== undefined;
};

export const isValidTimeRange = (startTime: Time, endTime: Time): boolean => {
    return startTime.compareTo(endTime) < 0;
};