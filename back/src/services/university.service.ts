import PersistenceFactory from "../factories/persistence.factory";
import University from "../models/abstract/university.model";
import PersistenceService from "./persistence/persistence.service";


export default class UniversityService {
    private static instance: UniversityService;
    
    private persistenceService: PersistenceService;

    constructor() {
        this.persistenceService = PersistenceFactory.get();
    }

    static getInstance = (): UniversityService => {
        if (!UniversityService.instance) {
            UniversityService.instance = new UniversityService();
        }
        return UniversityService.instance;
    };

    // public methods

    async getUniversity(id: string): Promise<University> {
        return await this.persistenceService.getUniversity(id);
    }
}
