import { ROLE } from "../../constants/general.constants";
import { validatePassword } from "../../helpers/auth.helper";

export default abstract class User {
    // Properties
    id: string;         // The id of the user in our databases
    email: string;      // Email the user uses to log in
    password: string;   // Hashed password with bcrypt to match when logging in
    role: ROLE

    // Abstract class constructor
    constructor(id: string, email: string, password: string, role: ROLE) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Methods
    public verify(password: string): boolean {
        return validatePassword(password, this.password);
    }
}
