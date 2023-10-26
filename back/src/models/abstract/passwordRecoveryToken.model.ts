import GenericModel from './generic.model';

export default abstract class PasswordRecoveryToken extends GenericModel {
    // Properties
    userId: string;
    expirationDate: Date;

    // Abstract class constructor
    constructor(id: string, userId: string, expirationDate: Date) {
        super(id);
        this.userId = userId;
        this.expirationDate = expirationDate;
    }

    // Methods
    public isCurrentlyValid(): boolean {
        const now = new Date();
        return now < this.expirationDate;
    }
}
