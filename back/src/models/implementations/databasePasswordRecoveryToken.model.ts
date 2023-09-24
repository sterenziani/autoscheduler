import mongoose, { Schema } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import PasswordRecoveryToken from "../abstract/passwordRecoveryToken.model";

export default class DatabasePasswordRecoveryToken extends PasswordRecoveryToken {
    // There is no need to add anything
}

// mongo needs to define Document, Schema and Model
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
