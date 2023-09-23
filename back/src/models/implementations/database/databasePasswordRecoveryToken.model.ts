import User from '../../abstract/user.model';
import mongoose, { Document, Schema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import PasswordRecoveryToken from '../../abstract/passwordRecoveryToken.model';
import { getDocument } from '../../../helpers/persistence/mongoPersistence.helper';
import DatabaseUser, { UserDocument, UserModel } from './databaseUser.model';
import GenericException from '../../../exceptions/generic.exception';
import { ERRORS } from '../../../constants/error.constants';

export default class DatabasePasswordRecoveryToken extends PasswordRecoveryToken {
    
    public async getUser(): Promise<User> {
        const maybeUser = await getDocument<UserDocument>(UserModel, this.userId, true);
        if (!maybeUser) throw new GenericException(ERRORS.NOT_FOUND.USER);
        return new DatabaseUser(maybeUser.id, maybeUser.email, maybeUser.password, maybeUser.role, maybeUser.locale);
    }
}

// Unlike the other models, users uses mongo, so it needs to define Document, Schema and Model
export interface PasswordRecoveryTokenDocument extends Document {
    userId: string;
    expirationDate: Date;
}

const passwordRecoveryTokenSchema: Schema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        expirationDate: { type: Date, required: true },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

passwordRecoveryTokenSchema.plugin(mongooseLeanVirtuals);
passwordRecoveryTokenSchema.index({"expirationDate": 1}, {expireAfterSeconds: 0});

export const PasswordRecoveryTokenModel = mongoose.model<PasswordRecoveryTokenDocument>('PasswordRecoveryToken', passwordRecoveryTokenSchema);
