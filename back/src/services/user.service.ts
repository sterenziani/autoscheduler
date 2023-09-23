import User from '../models/abstract/user.model';
import UserDao from '../persistence/abstract/user.dao';
import UserDaoFactory from '../factories/userDao.factory';
import { hashPassword } from '../helpers/auth.helper';
import { ROLE } from '../constants/general.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class UserService {
    private static instance: UserService;

    private dao: UserDao;

    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    constructor() {
        this.dao = UserDaoFactory.get();
    }

    init() {
        // Do nothing
    }

    // public methods
    async getUser(id: string): Promise<User> {
        return await this.dao.getById(id);
    }

    async getUsers(page: number, limit: number, textSearch?: string, role?: ROLE): Promise<PaginatedCollection<User>> {
        return await this.dao.findPaginated(page, limit, textSearch, role);
    }

    async getUserByEmail(email: string): Promise<User> {
        return await this.dao.getByEmail(email);
    }

    async createUser(email: string, password: string, role: ROLE, locale: string): Promise<User> {
        const hashedPassword = hashPassword(password);
        return await this.dao.create(email, hashedPassword, role, locale);
    }

    async modifyUser(userId: string, password?: string, locale?: string, email?: string, role?: ROLE): Promise<User> {
        const hashedPassword = password ? hashPassword(password) : undefined;
        return await this.dao.modify(userId, hashedPassword, locale, email, role);
    }

    async deleteUser(userId: string): Promise<void> {
        await this.dao.modify(userId, undefined, undefined, undefined, ROLE.DELETED);
    }
}
