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
        INVALID_PASSWORD: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PASSWORD',
            message: 'Provided password is invalid.',
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
        USER_ALREADY_EXISTS: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: 'USER_ALREADY_EXISTS',
            message: 'An user with provided params already exists.',
        },
    },
    UNAUTHORIZED: {
        GENERAL: { status: HTTP_STATUS.UNAUTHORIZED, code: 'UNAUTHORIZED', message: 'Unauthorized.' },
        MISSING_TOKEN: {
            status: HTTP_STATUS.UNAUTHORIZED,
            code: 'MISSING_TOKEN',
            message: 'Missing token in Authorization header.',
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
        COURSE_CLASS: {
            status: HTTP_STATUS.NOT_FOUND,
            code: 'COURSE_CLASS_NOT_FOUND',
            message: 'Course class not found.',
        },
        PROGRAM: { status: HTTP_STATUS.NOT_FOUND, code: 'PROGRAM_NOT_FOUND', message: 'Program not found.' },
        LECTURE: { status: HTTP_STATUS.NOT_FOUND, code: 'LECTURE_NOT_FOUND', message: 'Lecture not found.' },
        SCHEDULE: { status: HTTP_STATUS.NOT_FOUND, code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found.' },
    },
    CONFLICT: {
        GENERAL: { status: HTTP_STATUS.CONFLICT, code: 'CONFLICT', message: 'Conflict.' },
        USER_EXISTS: {
            status: HTTP_STATUS.CONFLICT,
            code: 'USER_EXISTS',
            message: 'User with same email exists already.',
        },
    },
    INTERNAL_SERVER_ERROR: {
        GENERAL: { status: HTTP_STATUS.SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error.' },
        DATABASE_CONNECTION: { status: HTTP_STATUS.SERVER_ERROR, code: 'DATABASE_CONNECTION', message: 'Failed to connect to database'},
        CORRUPTED_DATABASE: {
            status: HTTP_STATUS.SERVER_ERROR,
            code: 'CORRUPTED_DATABASE',
            message: 'Database data is corrupted, it needs manual cleaning.',
        },
    },
};
