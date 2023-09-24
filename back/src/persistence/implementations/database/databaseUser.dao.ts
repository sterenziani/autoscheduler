import { ROLE } from '../../../constants/general.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    createDocument,
    deleteDocuments,
    getDocument,
    getDocumentByQuery,
    updateDocument,
} from '../../../helpers/persistence/mongoPersistence.helper';
import { PaginatedCollection } from '../../../interfaces/paging.interface';
import User from '../../../models/abstract/user.model';
import DatabaseUser, { UserDocument, UserModel } from '../../../models/implementations/database/databaseUser.model';
import UserDao from '../../abstract/user.dao';
import { UpdateQuery } from 'mongoose';

// TODO: see if transactions matter
export default class DatabaseUserDao extends UserDao {
    private static instance: UserDao;

    static getInstance = () => {
        if (!DatabaseUserDao.instance) {
            DatabaseUserDao.instance = new DatabaseUserDao();
        }
        return DatabaseUserDao.instance;
    };

    // Abstract Methods Implementations
    public async init(): Promise<void> {
        return;
    }
    
    public async create(email: string, password: string, locale: string, role: ROLE): Promise<User> {
        const newUser = await createDocument<UserDocument>(UserModel, { email, password, locale, role });
        return this.documentToModel(newUser);
    }

    public async modify(userId: string, email?: string, password?: string, locale?: string, role?: ROLE): Promise<User> {
        const updateQuery: UpdateQuery<UserDocument> = {};
        if (email !== undefined) updateQuery.email = email;
        if (password !== undefined) updateQuery.password = password;
        if (locale !== undefined) updateQuery.locale = locale;
        if (role !== undefined) updateQuery.role = role;

        const maybeUpdatedUser = await updateDocument<UserDocument>(UserModel, { _id: userId }, updateQuery);
        
        if (!maybeUpdatedUser) throw new GenericException(this.notFoundError);
        return this.documentToModel(maybeUpdatedUser);
    }

    public async delete(userId: string): Promise<void> {
        await deleteDocuments<UserDocument>(UserModel, {_id: userId});
    }

    public async findById(id: string): Promise<User | undefined> {
        const maybeUser = await getDocument<UserDocument>(UserModel, id, true);
        return maybeUser ? this.documentToModel(maybeUser) : undefined;
    }

    // TODO: implement
    public async findPaginated(page: number, limit: number, textSearch?: string | undefined, role?: ROLE | undefined): Promise<PaginatedCollection<User>> {
        throw new Error('Not implemented');
    }

    public async findByEmail(email: string): Promise<User | undefined> {
        const maybeUser = await getDocumentByQuery<UserDocument>(UserModel, { email: email }, true);
        return maybeUser ? this.documentToModel(maybeUser) : undefined;
    }

    // Private helper methods
    private documentToModel(userDocument: UserDocument): DatabaseUser {
        return new DatabaseUser(
            userDocument.id as string,
            userDocument.email,
            userDocument.password,
            userDocument.role,
            userDocument.locale,
        );
    }
}
