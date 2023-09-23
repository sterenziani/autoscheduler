import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import PasswordRecoveryToken from '../../abstract/passwordRecoveryToken.model';
import User from '../../abstract/user.model';

export default class MemoryPasswordRecoveryToken extends PasswordRecoveryToken {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async getUser(): Promise<User> {
        const maybeUser = MEMORY_DATABASE.users.get(this.userId);
        if (!maybeUser) throw new GenericException(ERRORS.NOT_FOUND.USER);
        return maybeUser;
    }
}
