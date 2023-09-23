import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import PasswordRecoveryTokenDao from '../persistence/abstract/passwordRecoveryToken.dao';
import DatabasePasswordRecoveryTokenDao from '../persistence/implementations/database/databasePasswordRecoveryToken.dao';
import MemoryPasswordRecoveryTokenDao from '../persistence/implementations/memory/memoryPasswordRecoveryToken.dao';
import GenericDaoFactory from './genericDao.factory';

export default class PasswordRecoveryTokenDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): PasswordRecoveryTokenDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                return DatabasePasswordRecoveryTokenDao.getInstance();
            case PERSISTENCE.MEMORY:
                return MemoryPasswordRecoveryTokenDao.getInstance();
        }
    }
}
