import { IUser } from '../../models/user.model';

interface IUserMapper {
    getUserById(userId: string): Promise<IUser | null>;

    getUserByEmail(mail: string): Promise<IUser | null>;
}

export default IUserMapper;
