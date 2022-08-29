import { IErrorData } from '../interfaces/error.interface';
import HttpException from './http.exception';

class GenericException extends HttpException {
    constructor(error: IErrorData) {
        super(error.status, error.code, error.message);
    }
}

export default GenericException;
