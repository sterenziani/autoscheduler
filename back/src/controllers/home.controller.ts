import { RequestHandler } from 'express';
import UserAuthService from '../services/auth.service';
import UserService from '../services/user.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { HTTP_STATUS } from '../constants/http.constants';

export class HomeController {
    private userAuthService: UserAuthService;

    constructor() {
        this.userAuthService = UserAuthService.getInstance();
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
            res.status(HTTP_STATUS.OK).set('Authorization', jwt).send();
        } catch (e) {
            next(e);
        }
    };
}
