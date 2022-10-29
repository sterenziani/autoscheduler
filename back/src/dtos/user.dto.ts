import { IUser } from '../models/user.model';
import { ROLES } from '../constants/general.constants';

export const toDto = (user: IUser): IUserDto => {
    const url = getUrl(user.id, user.role);
    return {
        id: user.id,
        url,
        name: user.name,
        email: user.email,
        role: user.role,
    };
};

export const getUrl = (userId: string, role: ROLES): string => {
    return `/${role.toLowerCase()}/${userId}`;
};

export interface IUserDto {
    id: string;
    url: string;
    name: string;
    email: string;
    role: ROLES;
}
