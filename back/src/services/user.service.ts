import User from '../models/abstract/user.model';
import UserDao from '../persistence/abstract/user.dao';
import UserDaoFactory from '../factories/userDao.factory';

export default class UserService {
    private static instance: UserService;
    
    private dao: UserDao;

    constructor() {
        this.dao = UserDaoFactory.get();
    }

    static getInstance = (): UserService => {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    };

    // public methods
    async getUser(id: string): Promise<User> {
        return await this.dao.getById(id);
    }

    async getUserByEmail(email: string): Promise<User> {
        return await this.dao.getByEmail(email);
    }
}
