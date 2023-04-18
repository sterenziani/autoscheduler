export const ERRORS = {
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
        ROLE_MISMATCH: {
            status: 403,
            code: 'ROLE_MISMATCH',
            message: "Authenticated user's role doesn't match required role",
        },
    },
    NOT_FOUND: {
        GENERAL: { status: 404, code: 'NOT_FOUND', message: 'Not Found' },
        USER: { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' },
        STUDENT: { status: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
        UNIVERSITY: { status: 404, code: 'UNIVERSITY_NOT_FOUND', message: 'University not found' },
        TERM: { status: 404, code: 'TERM_NOT_FOUND', message: 'Term not found' },
        COURSE: { status: 404, code: 'COURSE_NOT_FOUND', message: 'Course not found' },
        BUILDING: { status: 404, code: 'BUILDING_NOT_FOUND', message: 'Building not found' },
        COURSE_CLASS: { status: 404, code: 'COURSE_CLASS_NOT_FOUND', message: 'Course class not found' },
        PROGRAM: { status: 404, code: 'PROGRAM_NOT_FOUND', message: 'Program not found' },
        LECTURE: { status: 404, code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' },
        SCHEDULE: { status: 404, code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found' },
    },
    CONFLICT: {
        GENERAL: { status: 409, code: 'CONFLICT', message: 'Conflict' },
    },
    INTERNAL_SERVER_ERROR: {
        GENERAL: { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
        CORRUPTED_DATABASE: {status: 500, code: 'CORRUPTED_DATABASE', message: 'Database data is corrupted, it needs manual cleaning.'}
    },
};
