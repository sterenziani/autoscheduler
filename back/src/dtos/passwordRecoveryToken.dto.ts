import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { getResourceUrl } from '../helpers/url.helper';
import PasswordRecoveryToken from '../models/abstract/passwordRecoveryToken.model';

export const passwordRecoveryTokenToDto = (token: PasswordRecoveryToken): IPasswordRecoveryTokenDto => {
    const url = getResourceUrl(RESOURCES.PASSWORD_RECOVERY_TOKEN, API_SCOPE.ROOT, token.id);
    return {
        id: token.id,
        valid: token.isCurrentlyValid(),
        url,
    };
};

interface IPasswordRecoveryTokenDto {
    id: string;
    valid: boolean;
    url: string;
}
