import { RequestHandler } from 'express';
import UserAuthService from '../services/auth.service';
import GenericException from '../exceptions/generic.exception';
import * as UserDto from '../dtos/user.dto';
import { ERRORS } from '../constants/error.constants';
import { HTTP_STATUS } from '../constants/http.constants';

export class AuthController {
    private authService: UserAuthService;

    constructor() {
        this.authService = UserAuthService.getInstance();
    }

    public createPasswordRecoveryToken: RequestHandler = async (req, res, next) => {
        const email = req.body.email;

        if (!email) return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));

        try {
            await this.authService.createPasswordRecoveryToken(email);
            res.status(HTTP_STATUS.CREATED).send();
        } catch (e) {
            next(e);
        }
    };

    public getUserFromPasswordRecoveryToken: RequestHandler = async (req, res, next) => {
        const token = req.params.token;

        if (!token) return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));

        try {
            const user = await this.authService.getUserFromPasswordRecoveryToken(token);
            res.status(HTTP_STATUS.OK).send(UserDto.userToDto(user));
        } catch (e) {
            next(e);
        }
    };

    public usePasswordRecoveryToken: RequestHandler = async (req, res, next) => {
        const token = req.params.token as string;
        const password = req.body.password as string;

        if (!token || !password) return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));

        try {
            const jwt = await this.authService.usePasswordRecoveryToken(token, password);
            res.status(HTTP_STATUS.OK).set('Authorization', jwt).send();
        } catch (e) {
            next(e);
        }
    };
}
