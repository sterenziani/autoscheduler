import { ERRORS } from "../../constants/error.constants";
import GenericException from "../../exceptions/generic.exception";
import { IErrorData } from "../../interfaces/error.interface";

export default abstract class GenericDao<T> {
    // Properties
    protected notFoundError: IErrorData;

    protected constructor(notFoundError?: IErrorData) {
        this.notFoundError = notFoundError ?? ERRORS.NOT_FOUND.GENERAL;
    }

    // Abstract Methods
    public abstract create(...args: any[]): Promise<T>;
    public abstract findById(id: string): Promise<T | undefined>;
    public abstract set(entity: T): Promise<void>;

    // Public Methods
    public async getById(id: string): Promise<T> {
        const maybeEntity = await this.findById(id);
        if (!maybeEntity) throw new GenericException(this.notFoundError);
        return maybeEntity;
    }
}