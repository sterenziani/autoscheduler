import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import UserDao from '../persistence/abstract/user.dao';
import MemoryUserDao from '../persistence/implementations/memory/memoryUser.dao';
import GenericDaoFactory from './genericDao.factory';
import DatabaseUserDao from "../persistence/implementations/database/databaseUser.dao";

export default class UserDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): UserDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                return DatabaseUserDao.getInstance();
            case PERSISTENCE.MEMORY:
                return MemoryUserDao.getInstance();
        }
    }
}
