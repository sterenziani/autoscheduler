import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { IUserInfo } from '../interfaces/auth.interface';

const STUDENT_PROGRAM_MAP: {[studentId: string]: string} = {};

export const jwtSign = (key: string, expireTime: string, payload: IUserInfo): string => {
    return jwt.sign(payload, key, { issuer: 'AutoSchedulerApi', expiresIn: expireTime, algorithm: 'RS256' });
};

export const jwtVerify = (publicKey: string, token: string): IUserInfo => {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as IUserInfo;
};

export const hashPassword = (password: string, rounds = 10): string => {
    const salt = bcrypt.genSaltSync(rounds);
    return bcrypt.hashSync(password, salt);
};

export const validatePassword = (password: string, hashedPassword: string): boolean => {
    return bcrypt.compareSync(password, hashedPassword);
};

export const mapStudentProgram = (studentId: string, programId: string): void => {
    STUDENT_PROGRAM_MAP[studentId] = programId;
};

export const getMappedStudentProgram = (studentId: string): string | undefined => {
    return STUDENT_PROGRAM_MAP[studentId]
};

export const clearMappedStudentProgram = (studentId: string): void => {
    delete STUDENT_PROGRAM_MAP[studentId];
}
