import { RequestHandler } from 'express';
import UserAuthService from '../services/auth.service';
import UserService from '../services/user.service';
import GenericException from '../exceptions/generic.exception';
import * as UserDto from '../dtos/user.dto';
import { ERRORS } from '../constants/error.constants';
import { HTTP_STATUS } from '../constants/http.constants';

export class UsersController {
    private userService: UserService;

    constructor() {
        this.userService = UserService.getInstance();
    }

    public createResetToken: RequestHandler = async (req, res, next) => {
        const email = req.body.email;
        try {
            if (!email) return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));
            await this.userService.createResetToken(email);
            res.status(HTTP_STATUS.CREATED).send();
        } catch (e) {
            next(e);
        }
    };

    public getUserWithResetToken: RequestHandler = async (req, res, next) => {
        const token = req.params.token;
        try {
            if (!token) return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));
            const resetToken = await this.userService.getResetToken(token);
            const user = await this.userService.getUserWithResetToken(token);
            res.status(HTTP_STATUS.OK).send(UserDto.userToDto(user));
        } catch (e) {
            next(e);
        }
    };

    public changeUserPassword: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const token = req.body.token as string;
        const password = req.body.password as string;

        try {
            if (!token || !password) return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));

            const resetToken = await this.userService.getResetToken(token);
            const user = await this.userService.getUserWithResetToken(token);
            if(user.id !== userId)
                return next(new GenericException(ERRORS.FORBIDDEN.GENERAL));
            const updatedUser = await this.userService.changePassword(userId, password)
            res.status(HTTP_STATUS.OK).location(UserDto.getUserUrl(user.id, user.role)).send();
        } catch (e) {
            next(e);
        }
    };
}
