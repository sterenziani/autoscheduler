import PersistenceService from './persistence/persistence.service';
import PersistenceFactory from '../factories/persistence.factory';
import User from '../models/abstract/user.model';

export default class UserService {
    private static instance: UserService;
    
    private persistenceService: PersistenceService;

    constructor() {
        this.persistenceService = PersistenceFactory.get();
    }

    static getInstance = (): UserService => {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    };

    // public methods
    async getUser(id: string): Promise<User> {
        return await this.persistenceService.getUser(id);
    }

    async getUserByEmail(email: string): Promise<User> {
        throw new Error('Not implemented');
    }
}
