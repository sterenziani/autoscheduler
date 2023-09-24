import UserDao from '../persistence/abstract/user.dao';
import DatabaseUserDao from "../persistence/implementations/databaseUser.dao";

export default class UserDaoFactory {
    // Static Getters
    public static get(): UserDao {
        return DatabaseUserDao.getInstance();
    }
}
