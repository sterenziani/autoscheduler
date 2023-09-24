import { RequestHandler } from 'express';
import UserService from '../services/user.service';
import * as UserDto from '../dtos/user.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import User from '../models/abstract/user.model';
import { RESOURCES } from '../constants/general.constants';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidLocale, isValidPassword, validateString } from '../helpers/validation.helper';
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

    public modifyUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;
        const password = validateString(req.body.password);
        const locale = validateString(req.body.locale);

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
