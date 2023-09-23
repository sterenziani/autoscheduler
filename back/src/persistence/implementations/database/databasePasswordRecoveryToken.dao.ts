import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { createDocument, deleteDocuments } from '../../../helpers/persistence/mongoPersistence.helper';
import PasswordRecoveryToken from '../../../models/abstract/passwordRecoveryToken.model';
import DatabasePasswordRecoveryToken, { PasswordRecoveryTokenDocument, PasswordRecoveryTokenModel } from '../../../models/implementations/database/databasePasswordRecoveryToken.model';
import MemoryPasswordRecoveryToken from '../../../models/implementations/memory/memoryPasswordRecoveryToken.model';
import PasswordRecoveryTokenDao from '../../abstract/passwordRecoveryToken.dao';
import {v4 as uuidv4} from 'uuid';

export default class DatabasePasswordRecoveryTokenDao extends PasswordRecoveryTokenDao {
    private static instance: PasswordRecoveryTokenDao;

    static getInstance = () => {
        if (!DatabasePasswordRecoveryTokenDao.instance) {
            DatabasePasswordRecoveryTokenDao.instance = new DatabasePasswordRecoveryTokenDao();
        }
        return DatabasePasswordRecoveryTokenDao.instance;
    };

    // Abstract Methods Implementations
    public async init(): Promise<void> {
        return;
    }

    public async create(userId: string, expirationDate: Date): Promise<PasswordRecoveryToken> {
        const doc = await createDocument<PasswordRecoveryTokenDocument>(PasswordRecoveryTokenModel, {userId, expirationDate});
        return this.documentToModel(doc);
    }

    public async delete(id: string): Promise<void> {
        await deleteDocuments<PasswordRecoveryTokenDocument>(PasswordRecoveryTokenModel, {_id: id});
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

    // Private helper methods
    private documentToModel(doc: PasswordRecoveryTokenDocument): DatabasePasswordRecoveryToken {
        return new DatabasePasswordRecoveryToken(
            doc.id as string,
            doc.userId,
            doc.expirationDate
        );
    }
    
}
