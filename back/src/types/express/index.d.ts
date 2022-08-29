import { IUserInfo } from '../../interfaces/auth.interface';

declare global {
    namespace Express {
        export interface Request {
            user: IUserInfo;
        }
    }
}
