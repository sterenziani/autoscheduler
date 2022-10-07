import { RequestHandler } from 'express';
import UserAuthService from '../services/auth.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import UserService from '../services/user.service';
import { userToDto } from '../dtos/user.dto';
import { IUser } from '../models/user.model';
import {HTTP_STATUS} from "../constants/http.constants";

export class HomeController {
    private userAuthService: UserAuthService;
    private userService: UserService;

    constructor() {
        this.userAuthService = UserAuthService.getInstance();
        this.userService = UserService.getInstance();
    }

    public healthCheck: RequestHandler = async (req, res) => {
        res.status(HTTP_STATUS.NO_CONTENT).send();
    };

    public login: RequestHandler = async (req, res, next) => {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));
        }

        try {
            const jwt: string = await this.userAuthService.login(email, password);
            const user: IUser = await this.userService.getUserByEmail(email);
            res.status(HTTP_STATUS.OK).set('Authorization', jwt).send(userToDto(user));
        } catch (e) {
            next(e);
        }
    };
}
