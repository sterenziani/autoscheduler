import { ROLE } from '../../../constants/general.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import User from '../../../models/abstract/user.model';
import MemoryUser from '../../../models/implementations/memory/memoryUser.model';
import UserDao from '../../abstract/user.dao';
import PasswordRecoveryToken from '../../../models/abstract/passwordRecoveryToken.model';
import MemoryPasswordRecoveryToken from '../../../models/implementations/memory/memoryPasswordRecoveryToken.model';
import { v4 as uuidv4 } from 'uuid';

export default class MemoryUserDao extends UserDao {
    private static instance: UserDao;

    static getInstance = () => {
        if (!MemoryUserDao.instance) {
            MemoryUserDao.instance = new MemoryUserDao();
        }
        return MemoryUserDao.instance;
    };

    // Abstract Methods Implementations
    public async init(): Promise<void> {
        return;
    }
    
    public async create(email: string, password: string, role: ROLE, locale: string): Promise<User> {
        const newUser = new MemoryUser(uuidv4(), email, password, role, locale);
        MEMORY_DATABASE.users.set(newUser.id, newUser);
        return newUser;
    }

    public async findById(id: string): Promise<User | undefined> {
        return MEMORY_DATABASE.users.get(id);
    }

    public async set(user: User): Promise<void> {
        await this.getById(user.id);

        if (!(user instanceof MemoryUser)) user = new MemoryUser(user.id, user.email, user.password, user.role, user.locale);

        MEMORY_DATABASE.users.set(user.id, user);
    }

    public async findByEmail(email: string): Promise<User | undefined> {
        for (const [key, value] of MEMORY_DATABASE.users) {
            if (value.email == email) return value;
        }
        return undefined;
    }

    public async createResetToken(userId: string, expirationDate: Date): Promise<PasswordRecoveryToken> {
        const newToken = new MemoryPasswordRecoveryToken(uuidv4(), expirationDate);
        MEMORY_DATABASE.resetTokens.set(userId, newToken);
        return newToken;
    }

    public async getResetToken(token: string): Promise<PasswordRecoveryToken | undefined> {
        for (const [key, value] of MEMORY_DATABASE.resetTokens) {
            if (value.id == token && value.isCurrentlyValid())
                return value;
        }
        return undefined;
    }

    public async findByResetToken(tokenId: string): Promise<User | undefined> {
        for (const [key, value] of MEMORY_DATABASE.resetTokens) {
            if (value.id == tokenId && value.isCurrentlyValid())
                return await this.findById(key);
        }
        return undefined;
    }

    public async deleteResetToken(userId: string): Promise<void> {
        MEMORY_DATABASE.resetTokens.delete(userId);
    }
}
