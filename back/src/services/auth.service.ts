import { DEFAULT_AUTH_TOKEN_EXPIRE_TIME } from '../constants/auth.constants';
import { IUserInfo } from '../interfaces/auth.interface';
import { ROLES } from '../constants/general.constants';
import { IUser } from '../models/user.model';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import { jwtSign, jwtVerify, validatePassword } from '../helpers/auth.helper';
import httpException from '../exceptions/http.exception';
import UserServiceFactory from './userFactory.service';

class UserAuthService {
    private static instance: UserAuthService;
    private readonly jwtKey: string;
    private readonly jwtPublicKey: string;
    private readonly expireTime: string;

    static getInstance = (): UserAuthService => {
        if (!UserAuthService.instance) {
            UserAuthService.instance = new UserAuthService();
        }
        return UserAuthService.instance;
    };

    private constructor() {
        this.jwtKey = process.env.AUTH_TOKEN_KEY!;
        this.jwtPublicKey = process.env.AUTH_TOKEN_PUB_KEY!;
        this.expireTime = process.env.AUTH_TOKEN_EXPIRE_TIME ?? DEFAULT_AUTH_TOKEN_EXPIRE_TIME;
    }

    // PUBLIC METHODS

    async login(email: string, password: string, role: ROLES): Promise<string> {
        // existence check
        let user: IUser | null = null;
        try {
            user = await UserServiceFactory.getUserService(role).getUserByEmail(email);
        } catch (e) {
            if (e instanceof httpException && e.code === ERRORS.NOT_FOUND.USER.code) {
                throw new GenericException(ERRORS.BAD_REQUEST.INVALID_LOGIN);
            } else {
                throw e;
            }
        }
        if (!user) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_LOGIN);

        // password check
        if (!validatePassword(password, user.password)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_LOGIN);

        // generate token
        const userInfo: IUserInfo = {
            id: user.id,
            email: user.email,
            role: role,
        };
        return jwtSign(this.jwtKey, this.expireTime, userInfo);
    }

    verifyToken(token: string): IUserInfo {
        return jwtVerify(this.jwtPublicKey, token);
    }
}

export default UserAuthService;
