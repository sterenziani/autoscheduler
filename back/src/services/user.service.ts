import User from '../models/abstract/user.model';
import UserDao from '../persistence/abstract/user.dao';
import UserDaoFactory from '../factories/userDao.factory';

export default class UserService {
    private static instance: UserService;

    private dao: UserDao;

    static getInstance = (): UserService => {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    };

    constructor() {
        this.dao = UserDaoFactory.get();
    }

    init() {
        // init services if required
    }

    // public methods
    async getUser(id: string): Promise<User> {
        return await this.dao.getById(id);
    }

    async getUserByEmail(email: string): Promise<User> {
        return await this.dao.getByEmail(email);
    }
}
