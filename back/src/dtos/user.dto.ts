import { ROLE } from '../constants/general.constants';
import User from '../models/abstract/user.model';

export const userToDto = (user: User): IUserDto => {
    const url = getUserUrl(user.id, user.role);
    return {
        id: user.id,
        url,
        email: user.email,
        role: user.role,
    };
};

export const getUserUrl = (userId: string, role: ROLE): string => {
    return `/${role.toLowerCase()}/${userId}`;
};

export interface IUserDto {
    id: string;
    url: string;
    email: string;
    role: ROLE;
}
