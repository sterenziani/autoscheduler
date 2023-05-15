import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import UserDao from '../persistence/abstract/user.dao';
import MemoryUserDao from '../persistence/implementations/memory/memoryUser.dao';
import GenericDaoFactory from './genericDao.factory';

export default class UserDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): UserDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryUserDao.getInstance();
        }
    }
}
