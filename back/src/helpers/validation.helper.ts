import TimeRange from './classes/timeRange.class';
import { DAY } from '../constants/time.constants';
import Time from './classes/time.class';
import { ILecture } from '../interfaces/courseClass.interface';
import { IBuildingDistancesInput } from '../interfaces/building.interface';

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

export const validateElemOrElemArray = <T>(data: any, validator: (data: any, ...args: any[]) => T | undefined, ...validatorArgs: any[]): T | T[] | undefined => {
    if (data == undefined) return undefined;
    if (Array.isArray(data)) {
        return validateArray<T>(data, validator, ...validatorArgs);
    } else {
        return validator(data, ...validatorArgs);
    }
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

export const validateUnavailableTime = (maybeTime: any): TimeRange | undefined => {
    try {
        let time = validateString(maybeTime);
        if (time === undefined) return undefined;

        const splitTime = time.split('-');
        if(splitTime.length != 3) return undefined;
        const maybeDay = splitTime[0];
        const maybeStartTime = splitTime[1];
        const maybeEndTime = splitTime[2];

        const day = validateEnum<DAY>(Number(maybeDay), DAY);
        if (day === undefined) return undefined;

        const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        const startTime = validateString(maybeStartTime);
        if (!timeRegex.test(startTime ?? '')) return undefined;
        const endTime = validateString(maybeEndTime);
        if (!timeRegex.test(endTime ?? '')) return undefined;

        return new TimeRange(day, Time.fromString(startTime!), Time.fromString(endTime!));
    } catch (e) {
        return undefined;
    }
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
}

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
}

export const isValidEnum = <T>(data: any, enumObject: any): boolean => {
    const maybeEnum = validateEnum<T>(data, enumObject);
    return maybeEnum !== undefined;
}

export const isValidInternalId = (internalId: string): boolean => {
    return internalId.length >= 1 && internalId.length <= 100;
}

export const isValidName = (name: string): boolean => {
    return name.length >= 3 && name.length <= 80;
}

export const isValidTimes = (time: string | string[]): boolean => {
    return true; // TODO: Validator
}