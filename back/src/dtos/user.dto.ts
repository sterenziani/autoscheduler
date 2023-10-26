import { API_SCOPE, RESOURCES, ROLE } from '../constants/general.constants';
import { getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';
import User from '../models/abstract/user.model';

// Scope determines where to locate the user
export const userToDto = (user: User, scope: API_SCOPE): IUserDto => {
    const url = getResourceUrl(RESOURCES.USER, scope, user.id);
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        locale: user.locale,
        url,
    };
};

export const paginatedUsersToDto = (paginatedUsers: PaginatedCollection<User>, scope: API_SCOPE): IUserDto[] => {
    return paginatedUsers.collection.map(u => userToDto(u, scope));
};

export const paginatedUsersToLinks = (paginatedUsers: PaginatedCollection<User>, basePath: string, limit: number, filter?: string, role?: ROLE): Record<string, string> => {
    return getPaginatedLinks(paginatedUsers, paginatedUsersUrlBuilder, basePath, limit, filter, role)
};

const paginatedUsersUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, role?: ROLE): string => {
    const params = {
        page,
        limit,
        filter,
        role
    };
    return queryParamsStringBuilder(basePath, params);
};

interface IUserDto {
    id: string;
    email: string;
    role: ROLE;
    locale: string;
    url: string;
}
