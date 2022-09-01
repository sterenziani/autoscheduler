import IUserMapper from '../mappers/interfaces/user.mapper';
import { IUser } from '../models/user.model';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserMapperFactory from "../mappers/factories/userMapper.factory";

class UserService {
    private static instance: UserService;
    private userMapper: IUserMapper;

    constructor() {
        this.userMapper = UserMapperFactory.get();
    }

    static getInstance = (): UserService => {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    };

    // common methods

    async getUserByEmail(email: string): Promise<IUser> {
        const user: IUser | null = await this.userMapper.getUserByEmail(email);
        if (!user) throw new GenericException(ERRORS.NOT_FOUND.USER);

        return user;
    }
}
export default UserService;
