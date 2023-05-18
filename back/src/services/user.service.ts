import User from '../models/abstract/user.model';
import UserDao from '../persistence/abstract/user.dao';
import UserDaoFactory from '../factories/userDao.factory';
import { hashPassword } from '../helpers/auth.helper';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { ROLE } from '../constants/general.constants';

export default class UserService {
    private static instance: UserService;
    private readonly passwordMinLength: number = 8;

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

    async createUser(email: string, password: string, role: ROLE): Promise<User> {
        // validate email
        if (!this.isValidEmail(email)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
        // email must not belong to existing user
        if (await this.dao.findByEmail(email)) throw new GenericException(ERRORS.BAD_REQUEST.USER_ALREADY_EXISTS);
        // validate password
        if (!this.isValidPassword(password)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD);

        const hashedPassword = hashPassword(password);
        return this.dao.create(email, hashedPassword, role);
    }

    // private functions

    private isValidEmail(email: string): boolean {
        // simple regex check
        const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPassword(password: string): boolean {
        // password length check
        if (password.length < this.passwordMinLength) return false;

        // at least one uppercase check
        if (!/[A-Z]/.test(password)) return false;

        // at least one lowercase check
        if (!/[a-z]/.test(password)) return false;

        // at least one number check
        if (!/[0-9]/.test(password)) return false;

        // passed all checks
        return true;
    }
}
