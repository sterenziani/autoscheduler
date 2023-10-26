import { RequestHandler } from 'express';
import UserService from '../services/user.service';
import * as UserDto from '../dtos/user.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import User from '../models/abstract/user.model';
import { API_SCOPE, DEFAULT_LOCALE, RESOURCES, ROLE } from '../constants/general.constants';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidEmail, isValidFilter, isValidLocale, isValidPassword, validateEnum, validateInt, validateString } from '../helpers/validation.helper';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { getReqPath, getResourceUrl } from '../helpers/url.helper';

export class UsersController {
    private userService: UserService;

    constructor() {
        this.userService = UserService.getInstance();
    }

    public getUsers: RequestHandler = async (req, res, next) => {
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const role = validateEnum<ROLE>(req.query.role, ROLE);

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));       // TODO: I think for users we are fine since it just searchs on email

        try {
            const paginatedUsers: PaginatedCollection<User> = await this.userService.getUsers(page, limit, filter, role);

            res.status(HTTP_STATUS.OK)
                .links(UserDto.paginatedUsersToLinks(paginatedUsers, getReqPath(req), limit, filter, role))
                .send(UserDto.paginatedUsersToDto(paginatedUsers, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public getUser: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;

        try {
            const user: User = await this.userService.getUser(userId);
            res.status(HTTP_STATUS.OK).send(UserDto.userToDto(user, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public createAdminUser: RequestHandler = async (req, res, next) => {
        const email = req.body.email as string | undefined;
        const password = validateString(req.body.password);
        const locale = validateString(req.body.locale) ?? DEFAULT_LOCALE;

        if (!email || !password) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidEmail(email)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_EMAIL));
        if (!isValidPassword(password)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD));
        if (!isValidLocale(locale)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_LOCALE));

        try {
            const user: User = await this.userService.createUser(email, password, locale, ROLE.ADMIN);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.USER, API_SCOPE.ROOT, user.id))
                .send(UserDto.userToDto(user, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public modifyUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;
        const email = validateString(req.body.email);
        const password = validateString(req.body.password);
        const locale = validateString(req.body.locale) ?? DEFAULT_LOCALE;

        if (!email && !password && !locale) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (email && !isValidEmail(email)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_EMAIL));
        if (password && !isValidPassword(password)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD));
        if (locale && !isValidLocale(locale)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_LOCALE));

        try {
            const user: User = await this.userService.modifyUser(userId, password, locale, email);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.USER, API_SCOPE.ROOT, user.id))
                .send(UserDto.userToDto(user, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public deleteUser: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;

        try {
            await this.userService.deleteUser(userId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };
}
