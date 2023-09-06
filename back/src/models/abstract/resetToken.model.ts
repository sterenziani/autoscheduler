import { ROLE } from '../../constants/general.constants';
import { validatePassword } from '../../helpers/auth.helper';
import GenericModel from './generic.model';
import User from './user.model';

export default abstract class ResetToken extends GenericModel {
    // Properties
    expirationDate: Date;

    // Abstract class constructor
    constructor(id: string, expirationDate: Date) {
        super(id);
        this.expirationDate = expirationDate;
    }

    // Methods
    public isCurrentlyValid(): boolean {
        const now = new Date();
        return now < this.expirationDate;
    }

    public abstract getUser(): Promise<User>;
}
