import { IUser } from '../../models/user.model';

abstract class IUserMapper {
    abstract getUserById(userId: string): Promise<IUser | null>;

    abstract getUserByEmail(mail: string): Promise<IUser | null>;
}

export default IUserMapper;
