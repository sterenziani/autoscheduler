import GenericException from '../exceptions/generic.exception';
import { NextFunction, Request, Response } from 'express';
import { ERRORS } from '../constants/error.constants';
import UserAuthService from '../services/auth.service';
import httpException from '../exceptions/http.exception';

const userAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.get('authorization');
    if (!authHeader || !authHeader.match(/^bearer ([^\s]*)/i)) return next();

    // getting last element
    const token = authHeader!.split(/[\s,]+/).pop();
    if (!token) throw new GenericException(ERRORS.UNAUTHORIZED.MISSING_TOKEN);

    let decodedToken;
    try {
        decodedToken = UserAuthService.getInstance().verifyToken(token);
    } catch (e) {
        if (e instanceof httpException) {
            res.status(e.status).send({ code: e.code, message: e.message });
        } else {
            const newError = ERRORS.INTERNAL_SERVER_ERROR.GENERAL;
            res.status(newError.status).send({ code: newError.code, message: newError.message });
        }
        return;
    }
    req.user = decodedToken;
    next();
};

export default userAuthMiddleware;
