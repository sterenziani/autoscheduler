import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import PasswordRecoveryToken from '../../../models/abstract/passwordRecoveryToken.model';
import MemoryPasswordRecoveryToken from '../../../models/implementations/memory/memoryPasswordRecoveryToken.model';
import PasswordRecoveryTokenDao from '../../abstract/passwordRecoveryToken.dao';
import {v4 as uuidv4} from 'uuid';

export default class MemoryPasswordRecoveryTokenDao extends PasswordRecoveryTokenDao {
    private static instance: PasswordRecoveryTokenDao;

    static getInstance = () => {
        if (!MemoryPasswordRecoveryTokenDao.instance) {
            MemoryPasswordRecoveryTokenDao.instance = new MemoryPasswordRecoveryTokenDao();
        }
        return MemoryPasswordRecoveryTokenDao.instance;
    };

    // Abstract Methods Implementations
    public async init(): Promise<void> {
        return;
    }

    public async create(userId: string, expirationDate: Date): Promise<PasswordRecoveryToken> {
        const newToken = new MemoryPasswordRecoveryToken(uuidv4(), userId, expirationDate);
        MEMORY_DATABASE.passwordRecoveryTokens.set(newToken.id, newToken);
        return newToken;
    }

    public async delete(id: string): Promise<void> {
        MEMORY_DATABASE.passwordRecoveryTokens.delete(id);
    }

    public async findById(id: string): Promise<PasswordRecoveryToken | undefined> {
        return MEMORY_DATABASE.passwordRecoveryTokens.get(id);
    }

    public async set(token: PasswordRecoveryToken): Promise<void> {
        const existingToken = await this.getById(token.id);
        existingToken.userId = token.userId;
        existingToken.expirationDate = token.expirationDate;
        MEMORY_DATABASE.passwordRecoveryTokens.set(existingToken.id, existingToken);
    }
    
}
