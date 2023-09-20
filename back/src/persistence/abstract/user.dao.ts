import { ERRORS } from '../../constants/error.constants';
import { ROLE } from '../../constants/general.constants';
import GenericException from '../../exceptions/generic.exception';
import User from '../../models/abstract/user.model';
import ResetToken from '../../models/abstract/resetToken.model';
import GenericDao from './generic.dao';
import { hashPassword } from '../../helpers/auth.helper';

export default abstract class UserDao extends GenericDao<User> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.USER);
        // Initialize DB with admin user
        this.create(process.env.ADMIN_EMAIL??"", hashPassword(process.env.ADMIN_PASS??""), ROLE.ADMIN, "en").catch((_) => {});
    }

    // Abstract Methods
    public abstract create(email: string, password: string, role: ROLE, locale: string): Promise<User>;
    public abstract findByEmail(email: string): Promise<User | undefined>;
    public abstract createResetToken(userId: string, expirationDate: Date): Promise<ResetToken>;
    public abstract getResetToken(token: string): Promise<ResetToken | undefined>;
    public abstract findByResetToken(tokenId: string): Promise<User | undefined>;
    public abstract deleteResetToken(userId: string): Promise<void>;

    // Public Methods implementations
    public async getByEmail(email: string): Promise<User> {
        const maybeUser = await this.findByEmail(email);
        if (!maybeUser) throw new GenericException(this.notFoundError);
        return maybeUser;
    }
}
