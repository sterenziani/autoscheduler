import { createDocument, deleteDocuments, getDocument, parseErrors } from '../../helpers/persistence/mongoPersistence.helper';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import PasswordRecoveryToken from '../../models/abstract/passwordRecoveryToken.model';
import DatabasePasswordRecoveryToken, { PasswordRecoveryTokenDocument, PasswordRecoveryTokenModel } from '../../models/implementations/databasePasswordRecoveryToken.model';
import PasswordRecoveryTokenDao from '../abstract/passwordRecoveryToken.dao';

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
        try {
            const doc = await createDocument<PasswordRecoveryTokenDocument>(PasswordRecoveryTokenModel, {userId, expirationDate});
            return this.documentToModel(doc);
        }
        catch(err){
            throw parseErrors(err, '[PasswordRecoveryTokenDao:create]');
        }
    }

    public async modify(id: string): Promise<PasswordRecoveryToken> {
        try {
            return await this.getById(id);
        }
        catch(err){
            throw parseErrors(err, '[PasswordRecoveryTokenDao:modify]');
        }
    }

    public async delete(id: string): Promise<void> {
        try {
            await deleteDocuments<PasswordRecoveryTokenDocument>(PasswordRecoveryTokenModel, {_id: id});
        }
        catch(err){
            throw parseErrors(err, '[PasswordRecoveryTokenDao:delete]');
        }
    }

    public async findById(id: string): Promise<PasswordRecoveryToken | undefined> {
        try {
            const maybeDoc = await getDocument<PasswordRecoveryTokenDocument>(PasswordRecoveryTokenModel, id, true);
            return maybeDoc ? this.documentToModel(maybeDoc) : undefined;
        }
        catch(err){
            throw parseErrors(err, '[PasswordRecoveryTokenDao:findById]');
        }
    }

    // This is never used
    public findPaginated(page: number, limit: number, ...args: any[]): Promise<PaginatedCollection<PasswordRecoveryToken>> {
        throw Error('Not implemented');
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
