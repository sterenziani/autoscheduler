import IUserMapper from '../mappers/interfaces/user.mapper';
import { IUser } from '../models/user.model';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';

abstract class UserService {
    userMapper: IUserMapper;

    protected constructor(userMapper: IUserMapper) {
        this.userMapper = userMapper;
    }

    // common methods

    async getUserByEmail(email: string): Promise<IUser> {
        const user: IUser | null = await this.userMapper.getUserByEmail(email);
        if (!user) throw new GenericException(ERRORS.NOT_FOUND.USER);

        return user;
    }
}
export default UserService;
