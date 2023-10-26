import { ROLE } from '../constants/general.constants';

export interface IUserInfo {
    id: string;
    email: string;
    role: ROLE;
    locale: string;
    universityId?: string;      // Present if it's university or student
    studentId?: string;         // Present if it's student
    programId?: string;         // Present if it's student
}
