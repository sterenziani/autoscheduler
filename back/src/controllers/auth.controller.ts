import { RequestHandler } from 'express';
import UserAuthService from '../services/auth.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { HTTP_STATUS } from '../constants/http.constants';
import { isValidEmail, isValidPassword, validateString } from '../helpers/validation.helper';

export class AuthController {
    private authService: UserAuthService;

    constructor() {
        this.authService = UserAuthService.getInstance();
    }

    public createPasswordRecoveryToken: RequestHandler = async (req, res, next) => {
        const email = validateString(req.body.email);

        if (!email) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidEmail(email)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_EMAIL));

        try {
            await this.authService.createPasswordRecoveryToken(email);
            res.status(HTTP_STATUS.CREATED).send();
        } catch (e) {
            next(e);
        }
    };

    public usePasswordRecoveryToken: RequestHandler = async (req, res, next) => {
        const token = req.params.token;
        const password = validateString(req.body.password);

        if (!password) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidPassword(password)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD));

        try {
            const jwt = await this.authService.usePasswordRecoveryToken(token, password);
            res.status(HTTP_STATUS.OK).set('Authorization', jwt).send();
        } catch (e) {
            next(e);
        }
    };
}
