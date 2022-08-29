import { IErrorData } from '../interfaces/error.interface';

export const ERRORS: { [status: string]: { [data: string]: IErrorData } } = {
    BAD_REQUEST: {
        GENERAL: { status: 400, code: 'BAD_REQUEST', message: 'Bad Request' },
        INVALID_LOGIN: { status: 400, code: 'INVALID_LOGIN', message: 'Incorrect username or password' },
    },
    UNAUTHORIZED: {
        GENERAL: { status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' },
        MISSING_TOKEN: { status: 401, code: 'MISSING_TOKEN', message: 'Missing token in Authorization header' },
    },
    FORBIDDEN: {
        GENERAL: { status: 403, code: 'FORBIDDEN', message: 'Forbidden' },
    },
    NOT_FOUND: {
        GENERAL: { status: 404, code: 'NOT_FOUND', message: 'Not Found' },
        USER: { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' },
    },
    CONFLICT: {
        GENERAL: { status: 409, code: 'CONFLICT', message: 'Conflict' },
    },
    INTERNAL_SERVER_ERROR: {
        GENERAL: { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
    },
};
