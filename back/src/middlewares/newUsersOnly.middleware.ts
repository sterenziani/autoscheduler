import { NextFunction, Request, Response } from 'express';
import { ROLE } from '../constants/general.constants';
import { ERRORS } from '../constants/error.constants';
import { IErrorData } from '../interfaces/error.interface';

const newUsersOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== ROLE.NEW) {
        const newError: IErrorData = ERRORS.FORBIDDEN.ROLE_MISMATCH;
        res.status(newError.status).send({ code: newError.code, message: newError.message });
        return;
    }
    next();
};

export default newUsersOnlyMiddleware;
