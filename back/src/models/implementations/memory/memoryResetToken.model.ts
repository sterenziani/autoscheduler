import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import ResetToken from '../../abstract/resetToken.model';
import User from '../../abstract/user.model';

export default class MemoryResetToken extends ResetToken {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async getUser(): Promise<User> {
        for (const [key, value] of MEMORY_DATABASE.resetTokens) {
            if (value.id == this.id && value.isCurrentlyValid()){
                const maybeUser = await MEMORY_DATABASE.users.get(key);
                if(!maybeUser) throw new GenericException(ERRORS.NOT_FOUND.USER);
                return maybeUser;
            }
        }
        throw new GenericException(ERRORS.NOT_FOUND.USER);
    }
}
