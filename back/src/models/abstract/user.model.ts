import { ROLE } from '../../constants/general.constants';
import { validatePassword } from '../../helpers/auth.helper';
import GenericModel from './generic.model';

export default abstract class User extends GenericModel {
    // Properties
    email: string; // Email the user uses to log in
    password: string; // Hashed password with bcrypt to match when logging in
    role: ROLE;
    locale: string;

    // Abstract class constructor
    constructor(id: string, email: string, password: string, role: ROLE, locale: string) {
        super(id);
        this.email = email;
        this.password = password;
        this.role = role;
        this.locale = locale;
    }

    // Methods
    public verify(password: string): boolean {
        return validatePassword(password, this.password);
    }
}
