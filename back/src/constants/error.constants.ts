import { IErrorData } from '../interfaces/error.interface';
import { HTTP_STATUS } from './http.constants';

export const ERRORS: { [category: string]: { [subcategory: string]: IErrorData } } = {
    BAD_REQUEST: {
        GENERAL: { status: HTTP_STATUS.BAD_REQUEST, code: 'BAD_REQUEST', message: 'Bad Request.' },
        INVALID_LOGIN: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_LOGIN',
            message: 'Incorrect username or password.',
        },
        INVALID_OBJECT_ID: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_OBJECT_ID',
            message: 'Given value does not match a valid mongo ObjectId.',
        },
        MISSING_PARAMS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'MISSING_PARAMS',
            message: 'Missing at least one required param.',
        },
        INVALID_PASSWORD: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PASSWORD',
            message: 'Provided password is invalid.',
        },
        INVALID_EMAIL: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_EMAIL',
            message: 'Provided email is invalid.',
        },
        INVALID_LOCALE: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_LOCALE',
            message: 'Provided locale is invalid or unsupported.',
        },
        INVALID_ROLE: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_ROLE',
            message: 'Provided role is invalid.',
        },
        INVALID_NAME: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_NAME',
            message: 'Provided name is invalid. It must have a length between 3 and 80 characters.',
        },
        INVALID_INTERNAL_ID: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_INTERNAL_ID',
            message: 'Provided internalId is invalid. It must have a length between 1 and 100 characters.',
        },
        COURSES_INTERSECT: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'COURSES_INTERSECT',
            message: 'There is a conflict between values in mandatory courses y values in optional courses.',
        },
        INVALID_TIMES: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_TIMES',
            message: 'Provided times are not valid times. It needs to follow d-hh:mm-hh:mm format, with start before end. And entries in array cannot overlap.',
        },
        INVALID_DAY: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_DAY',
            message: 'Day number is invalid. It should be a integer from 0 (Sun) to 6 (Sat).',
        },
        INVALID_TIME_OF_DAY: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_TIME_RANGE',
            message: 'Given time of day is not valid. It should follow format hh:mm in 24hs',
        },
        INVALID_TIME_RANGE: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_TIME_RANGE',
            message: 'Format of the time is invalid. It should follow.',
        },
        INVALID_FROM_AND_TO: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_FROM_AND_TO',
            message: 'Privded from and to dates are invalid. to date needs to be after from date.',
        },
        INVALID_BUILDING_DISTANCES: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_BUILDING_DISTANCES',
            message: 'Provided ditances are not valid. It should be an object where the keys are the target building ids and the value of each key is the integer distance in minutes.',
        },
        INVALID_PARAMS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PARAMS',
            message: 'Provided params has invalid values.',
        },
        INVALID_PAGING_PARAMS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PAGING_PARAMS',
            message: 'Page-size must be positive integer & page must be integer.',
        },
        BUILDING_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'BUILDING_ALREADY_EXISTS',
            message: 'A building with provided internalId already exists.',
        },
        COURSE_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'COURSE_ALREADY_EXISTS',
            message: 'A course with provided internalId already exists.',
        },
        COURSE_CLASS_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'COURSE_CLASS_ALREADY_EXISTS',
            message: 'A class with provided name already exists for this course and term.',
        },
        PROGRAM_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'PROGRAM_ALREADY_EXISTS',
            message: 'A program with provided internalId already exists.',
        },
        TERM_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'TERM_ALREADY_EXISTS',
            message: 'A term with provided internalId already exists.',
        },
        USER_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'USER_ALREADY_EXISTS',
            message: 'An user with provided params already exists.',
        },
        UNIVERSITY_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'UNIVERSITY_ALREADY_EXISTS',
            message: 'An university with provided params already exists.',
        },
    },
    UNAUTHORIZED: {
        GENERAL: { status: HTTP_STATUS.UNAUTHORIZED, code: 'UNAUTHORIZED', message: 'Unauthorized.' },
        MISSING_TOKEN: {
            status: HTTP_STATUS.UNAUTHORIZED,
            code: 'MISSING_TOKEN',
            message: 'Missing token in Authorization header.',
        },
        EXPIRED_TOKEN: {
            status: HTTP_STATUS.UNAUTHORIZED,
            code: 'EXPIRED_TOKEN',
            message: 'Expired token in Authorization header.',
        },
    },
    FORBIDDEN: {
        GENERAL: { status: HTTP_STATUS.FORBIDDEN, code: 'FORBIDDEN', message: 'Forbidden.' },
        ROLE_MISMATCH: {
            status: HTTP_STATUS.FORBIDDEN,
            code: 'ROLE_MISMATCH',
            message: "Authenticated user's role doesn't match required role.",
        },
    },
    NOT_FOUND: {
        GENERAL: { status: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND', message: 'Not Found.' },
        USER: { status: HTTP_STATUS.NOT_FOUND, code: 'USER_NOT_FOUND', message: 'User not found.' },
        STUDENT: { status: HTTP_STATUS.NOT_FOUND, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' },
        UNIVERSITY: { status: HTTP_STATUS.NOT_FOUND, code: 'UNIVERSITY_NOT_FOUND', message: 'University not found.' },
        TERM: { status: HTTP_STATUS.NOT_FOUND, code: 'TERM_NOT_FOUND', message: 'Term not found.' },
        COURSE: { status: HTTP_STATUS.NOT_FOUND, code: 'COURSE_NOT_FOUND', message: 'Course not found.' },
        BUILDING: { status: HTTP_STATUS.NOT_FOUND, code: 'BUILDING_NOT_FOUND', message: 'Building not found.' },
        BUILDING_DISTANCE: { status: HTTP_STATUS.NOT_FOUND, code: 'BUILDING_DISTANCE_NOT_FOUND', message: 'Building distance not found.' },
        COURSE_CLASS: {
            status: HTTP_STATUS.NOT_FOUND,
            code: 'COURSE_CLASS_NOT_FOUND',
            message: 'Course class not found.',
        },
        PROGRAM: { status: HTTP_STATUS.NOT_FOUND, code: 'PROGRAM_NOT_FOUND', message: 'Program not found.' },
        LECTURE: { status: HTTP_STATUS.NOT_FOUND, code: 'LECTURE_NOT_FOUND', message: 'Lecture not found.' },
        SCHEDULE: { status: HTTP_STATUS.NOT_FOUND, code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found.' },
        PASSWORD_RECOVERY_TOKEN: { status: HTTP_STATUS.NOT_FOUND, code: 'PASSWORD_RECOVERY_TOKEN_NOT_FOUND', message: 'Password recovery token not found.' },
    },
    CONFLICT: {
        GENERAL: { status: HTTP_STATUS.CONFLICT, code: 'CONFLICT', message: 'Conflict.' },
        CANNOT_DELETE: {
            status: HTTP_STATUS.CONFLICT,
            code: 'CANNOT_DELETE',
            message: 'Cannot delete due to pre-existing constraints like relationships that need to be deleted first.',
        },
    },
    INTERNAL_SERVER_ERROR: {
        GENERAL: { status: HTTP_STATUS.SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error.' },
        DATABASE: { status: HTTP_STATUS.SERVER_ERROR, code: 'DATABASE_ERROR', message: 'Unknown database error.' },
        DATABASE_CONNECTION: {
            status: HTTP_STATUS.SERVER_ERROR,
            code: 'DATABASE_CONNECTION',
            message: 'Failed to connect to database',
        },
        CORRUPTED_DATABASE: {
            status: HTTP_STATUS.SERVER_ERROR,
            code: 'CORRUPTED_DATABASE',
            message: 'Database data is corrupted, it needs manual cleaning.',
        },
    },
};
