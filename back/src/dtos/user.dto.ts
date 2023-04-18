import { ROLE } from '../constants/general.constants';
import User from '../models/abstract/user.model';

// TODO: not a fan of multiple methods called toDto, maybe we can just add this to the abstract class User? or we leave it like this but we give the methods better names like userToDto
export const toDto = (user: User): IUserDto => {
    const url = getUrl(user.id, user.role);
    return {
        id: user.id,
        url,
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
    email: string;
    role: ROLE;
}
