import { ERRORS } from "../../constants/error.constants";
import { ROLE } from "../../constants/general.constants";
import GenericException from "../../exceptions/generic.exception";
import User from "../../models/abstract/user.model";
import GenericDao from "./generic.dao";

export default abstract class UserDao extends GenericDao<User> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.USER);
    }
    
    // Abstract Methods
    public abstract create(email: string, password: string, role: ROLE): Promise<User>;
    public abstract findByEmail(email: string): Promise<User | undefined>;

    // Public Methods implementations
    public async getByEmail(email: string): Promise<User> {
        const maybeUser = await this.findByEmail(email);
        if (!maybeUser) throw new GenericException(this.notFoundError);
        return maybeUser;
    }
}