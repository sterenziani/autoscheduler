import { ROLE } from '../../../constants/general.constants';
import { ERRORS } from '../../../constants/error.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    createDocument,
    getDocument,
    getDocumentByQuery,
    updateDocument,
} from '../../../helpers/persistence/mongoPersistence.helper';
import User from '../../../models/abstract/user.model';
import DatabaseUser, { UserDocument, UserModel } from '../../../models/implementations/database/databaseUser.model';
import UserDao from '../../abstract/user.dao';
import ResetToken from '../../../models/abstract/resetToken.model';

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
    public async create(email: string, password: string, role: ROLE): Promise<User> {
        const newUser = await createDocument<UserDocument>(UserModel, { email, password, role });
        return this.documentToModel(newUser);
    }

    public async findById(id: string): Promise<User | undefined> {
        const maybeUser = await getDocument<UserDocument>(UserModel, id, true);
        return maybeUser ? this.documentToModel(maybeUser) : undefined;
    }

    public async set(user: User): Promise<void> {
        const maybeUpdatedUser = await updateDocument<UserDocument>(
            UserModel,
            { _id: user.id },
            { email: user.email, password: user.password, role: user.role },
        );
        if (!maybeUpdatedUser) throw new GenericException(this.notFoundError);
    }

    public async findByEmail(email: string): Promise<User | undefined> {
        const maybeUser = await getDocumentByQuery<UserDocument>(UserModel, { email: email }, true);
        return maybeUser ? this.documentToModel(maybeUser) : undefined;
    }

    // TODO: Implement
    public async createResetToken(userId: string, expirationDate: Date): Promise<ResetToken> {
        return {id: "", expirationDate: expirationDate, isCurrentlyValid:() => true, getUser: () => {throw new GenericException(ERRORS.NOT_FOUND.USER)}};
    }

    // TODO: Implement
    public async getResetToken(token: string): Promise<ResetToken | undefined> {
        return undefined;
    }

    // TODO: Implement
    public async findByResetToken(tokenId: string): Promise<User | undefined> {
        return undefined;
    }

    // TODO: Implement
    public async deleteResetToken(userId: string): Promise<void> {
    }

    // Private helper methods
    private documentToModel(userDocument: UserDocument): DatabaseUser {
        return new DatabaseUser(
            userDocument.id as string,
            userDocument.email,
            userDocument.password,
            userDocument.role,
        );
    }
}
