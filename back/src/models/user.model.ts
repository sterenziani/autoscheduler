import { ROLES } from '../constants/general.constants';

export interface IUser {
    id: string;
    password: string;
    name: string;
    email: string;
    role: ROLES;
}
