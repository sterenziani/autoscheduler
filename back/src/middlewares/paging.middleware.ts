import { NextFunction, Request, Response } from 'express';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';

const pagingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const page = req.query.page ? parseFloat(req.query.page as string) : undefined;
    const maybeLimit = req.query.limit ?? req.query.per_page;
    const limit = maybeLimit ? parseFloat(maybeLimit as string) : undefined;

    try {
        // limit must be either undefined or positive integer
        if (limit && (!Number.isInteger(limit) || limit <= 0))
            throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PAGING_PARAMS);
        // offset must be either undefined or integer
        if (page && !Number.isInteger(page)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PAGING_PARAMS);
    } catch (e: any) {
        res.status(e.status).send({ code: e.code, message: e.message });
    }
    // no problems
    next();
};

export default pagingMiddleware;
