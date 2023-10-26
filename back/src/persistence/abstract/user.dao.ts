import { ERRORS } from '../../constants/error.constants';
import { ROLE } from '../../constants/general.constants';
import GenericException from '../../exceptions/generic.exception';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import User from '../../models/abstract/user.model';
import GenericDao from './generic.dao';

export default abstract class UserDao extends GenericDao<User> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.USER);
    }

    // Abstract Methods Signature Override
    public abstract create(email: string, password: string, locale: string, role: ROLE): Promise<User>;
    public abstract modify(userId: string, email?: string, password?: string, locale?: string, role?: ROLE): Promise<User>;
    
    public abstract findPaginated(page: number, limit: number, textSearch?: string, role?: ROLE): Promise<PaginatedCollection<User>>;

    // Abstract Methods
    public abstract findByEmail(email: string): Promise<User | undefined>;

    // Public Methods
    public async getByEmail(email: string): Promise<User> {
        const maybeUser = await this.findByEmail(email);
        if (!maybeUser) throw new GenericException(this.notFoundError);
        return maybeUser;
    }
}
