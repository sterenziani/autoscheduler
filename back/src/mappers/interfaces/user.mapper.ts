import { User } from '../../models/user.interface';

interface IUserMapper {
    getUserById(userId: string): Promise<User | null>;

    getUserByEmail(mail: string): Promise<User | null>;
}

export default IUserMapper;
