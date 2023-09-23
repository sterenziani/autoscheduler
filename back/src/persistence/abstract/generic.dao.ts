import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { IErrorData } from '../../interfaces/error.interface';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class GenericDao<T> {
    // Properties
    protected notFoundError: IErrorData;

    protected constructor(notFoundError?: IErrorData) {
        this.notFoundError = notFoundError ?? ERRORS.NOT_FOUND.GENERAL;
    }

    // Abstract Methods
    public abstract init(): Promise<void>;
    
    public abstract create(...args: any[]): Promise<T>;
    public abstract modify(id: string, ...args: any[]): Promise<T>;
    public abstract delete(id: string, ...args: any[]): Promise<void>;
    
    public abstract findById(id: string, ...args: any[]): Promise<T | undefined>;
    public abstract findPaginated(page: number, limit: number, ...args: any[]): Promise<PaginatedCollection<T>>;

    // Public Methods
    public async getById(id: string, ...args: any[]): Promise<T> {
        const maybeEntity = await this.findById(id, ...args);
        if (!maybeEntity) throw new GenericException(this.notFoundError);
        return maybeEntity;
    }
}
