import PasswordRecoveryTokenDao from '../persistence/abstract/passwordRecoveryToken.dao';
import DatabasePasswordRecoveryTokenDao from '../persistence/implementations/databasePasswordRecoveryToken.dao';

export default class PasswordRecoveryTokenDaoFactory {
    // Static Getters
    public static get(): PasswordRecoveryTokenDao {
        return DatabasePasswordRecoveryTokenDao.getInstance();
    }
}
