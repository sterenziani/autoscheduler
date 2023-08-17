import GenericException from '../exceptions/generic.exception';
import { NextFunction, Request, Response } from 'express';
import { ERRORS } from '../constants/error.constants';

const authUsersOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) throw new GenericException(ERRORS.UNAUTHORIZED.MISSING_TOKEN);
    next();
};

export default authUsersOnlyMiddleware;
