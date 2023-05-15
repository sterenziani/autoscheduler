import User from '../../abstract/user.model';
import mongoose, { Document, Schema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { ROLE } from '../../../constants/general.constants';

export default class DatabaseUser extends User {
    // For user there really is nothing much to do, user is just a simple get that is dealt with by the persistence service with a unified method verify that is implemented in abstract class
}

// Unlike the other models, users uses mongo, so it needs to define Document, Schema and Model
export interface UserDocument extends Document {
    email: string;
    password: string;
    role: ROLE;
}

const userSchema: Schema = new mongoose.Schema(
    {
        email: { type: String, maxLength: 80, required: true, unique: true },
        password: { type: String, maxLength: 80, required: true },
        role: { type: String, required: true, enum: ROLE },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

userSchema.plugin(mongooseLeanVirtuals);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
