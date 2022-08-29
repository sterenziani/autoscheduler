import { ROLES } from '../constants/general.constants';

export interface IUserInfo {
    id: string;
    email: string;
    role: ROLES;
}
