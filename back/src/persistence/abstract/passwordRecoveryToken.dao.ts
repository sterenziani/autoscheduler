import { ERRORS } from '../../constants/error.constants';
import PasswordRecoveryToken from '../../models/abstract/passwordRecoveryToken.model';
import GenericDao from './generic.dao';

export default abstract class PasswordRecoveryTokenDao extends GenericDao<PasswordRecoveryToken> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.PASSWORD_RECOVERY_TOKEN);
    }

    // Abstract Methods
    public abstract create(userId: string, expirationDate: Date): Promise<PasswordRecoveryToken>;
    public abstract delete(id: string): Promise<void>;
}
