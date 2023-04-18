import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { IUserInfo } from '../interfaces/auth.interface';

export const jwtSign = (key: string, expireTime: string, payload: IUserInfo) => {
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
