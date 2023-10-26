export enum ROLE {
    NEW = 'NEW',
    STUDENT = 'STUDENT',
    UNIVERSITY = 'UNIVERSITY',
    ADMIN = 'ADMIN',
    DELETED = 'DELETED'
}

export enum API_SCOPE {
    STUDENT,
    UNIVERSITY,
    ROOT
}

export enum RESOURCES {
    PASSWORD_RECOVERY_TOKEN,
    USER,
    UNIVERSITY,
    PROGRAM,
    COURSE,
    COURSE_CLASS,
    LECTURE,
    TERM,
    BUILDING,
    STUDENT,
}

export const DEFAULT_LOCALE = "en";
export const BASE_PATH = '/api/';
export const NO_PATH = '/';