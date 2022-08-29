import { RequestHandler } from 'express';
import UserAuthService from '../services/auth.service';
import { stringInEnum } from '../helpers/collection.helper';
import { ROLES } from '../constants/general.constants';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export class HomeController {
    private userAuthService: UserAuthService;

    constructor() {
        this.userAuthService = UserAuthService.getInstance();
    }

    public healthCheck: RequestHandler = async (req, res) => {
        res.status(204).send();
    };

    public login: RequestHandler = async (req, res, next) => {
        const email = req.body.email;
        const password = req.body.password;
        const role = req.body.role;

        if (!email || !password || !stringInEnum(ROLES, role)) {
            return next(new GenericException(ERRORS.BAD_REQUEST.GENERAL));
        }

        try {
            const jwt: string = await this.userAuthService.login(email, password, role);
            res.status(204).set('Authorization', jwt).send();
        } catch (e) {
            next(e);
        }
    };
}
