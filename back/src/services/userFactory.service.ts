import { ROLES } from '../constants/general.constants';
import UserService from './user.service';
import StudentService from './student.service';

class UserServiceFactory {
    static getUserService(role: ROLES): UserService {
        switch (role) {
            case ROLES.STUDENT:
                return StudentService.getInstance();
            // case ROLES.UNIVERSITY:// TODO: implement UniversityService & uncomment
            // return UniversityService.getInstance();
            // break;
            default:
                throw new Error(`No UserService found for role '${role}'`);
        }
    }
}
export default UserServiceFactory;
