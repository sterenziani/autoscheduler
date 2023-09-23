import { RequestHandler } from 'express';
import UserService from '../services/user.service';
import * as UserDto from '../dtos/user.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import User from '../models/abstract/user.model';
import { DEFAULT_LOCALE, RESOURCES, ROLE } from '../constants/general.constants';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidEmail, isValidLocale, isValidPassword } from '../helpers/validation.helper';
import { getScope } from '../helpers/api.helper';
import { getResourceUrl } from '../helpers/url.helper';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = UserService.getInstance();
    }

    public getUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;

        try {
            const user: User = await this.userService.getUser(userId);
            res.status(HTTP_STATUS.OK).send(UserDto.userToDto(user, getScope(user)));
        } catch (e) {
            next(e);
        }
    };

    public registerUser: RequestHandler = async (req, res, next) => {
        const email = req.body.email as string | undefined;
        const password = req.body.password as string | undefined;
        const locale = req.headers['accept-language'] ?? DEFAULT_LOCALE;

        if (!email || !password) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidEmail(email)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_EMAIL));
        if (!isValidPassword(password)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD));

        try {
            const user: User = await this.userService.createUser(email, password, ROLE.NEW, locale);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.USER, getScope(user), user.id))
                .send(UserDto.userToDto(user, getScope(user)))
        } catch (e) {
            next(e);
        }
    };

    public modifyUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;
        const password = req.body.password as string | undefined;
        const locale = req.body.locale as string | undefined;

        if (!password && !locale) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (password && !isValidPassword(password)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD));
        if (locale && !isValidLocale(locale)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_LOCALE));

        try {
            const user: User = await this.userService.modifyUser(userId, password, locale);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.USER, getScope(user), user.id))
                .send(UserDto.userToDto(user, getScope(user)));
        } catch (e) {
            next(e);
        }
    };
}
