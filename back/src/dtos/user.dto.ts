import { IUser } from '../models/user.model';
import { ROLES } from '../constants/general.constants';

export const userToDto = (user: IUser): IUserDto => {
    const userUrl = getUserUrl(user.id, user.role);
    return {
        id: user.id,
        url: userUrl,
        name: user.name,
        email: user.email,
        approvedCoursesUrl: `${userUrl}/courses`,
    };
};

export const getUserUrl = (userId: string, role: ROLES): string => {
    return `/api/${role.toLowerCase()}/${userId}`;
};

interface IUserDto {
    id: string;
    url: string;
    name: string;
    email: string;
    approvedCoursesUrl: string;
}
