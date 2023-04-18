import { User } from '../models/user.interface';
import { ROLE } from '../constants/general.constants';

export const toDto = (user: User): IUserDto => {
    const url = getUrl(user.id, user.role);
    return {
        id: user.id,
        url,
        name: user.name,
        email: user.email,
        role: user.role,
    };
};

export const getUrl = (userId: string, role: ROLE): string => {
    return `/${role.toLowerCase()}/${userId}`;
};

export interface IUserDto {
    id: string;
    url: string;
    name: string;
    email: string;
    role: ROLE;
}
