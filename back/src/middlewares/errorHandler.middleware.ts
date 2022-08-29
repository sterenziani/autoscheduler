import { Request, Response } from 'express';
import HttpException from '../exceptions/http.exception';
import { ERRORS } from '../constants/error.constants';

const ErrorHandlerMiddleware = (error: HttpException, req: Request, res: Response): void => {
    const status = error.status || ERRORS.INTERNAL_SERVER_ERROR.GENERAL.status;
    const code = error.code || ERRORS.INTERNAL_SERVER_ERROR.GENERAL.code;
    const message = error.message || ERRORS.INTERNAL_SERVER_ERROR.GENERAL.message;

    console.log(error);

    res.status(status).send({ code, message });
};

export default ErrorHandlerMiddleware;
