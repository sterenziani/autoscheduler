import UniversityDaoFactory from "../factories/universityDao.factory";
import University from "../models/abstract/university.model";
import UniversityDao from "../persistence/abstract/university.dao";


export default class UniversityService {
    private static instance: UniversityService;
    
    private dao: UniversityDao;

    constructor() {
        this.dao = UniversityDaoFactory.get();
    }

    static getInstance = (): UniversityService => {
        if (!UniversityService.instance) {
            UniversityService.instance = new UniversityService();
        }
        return UniversityService.instance;
    };

    // public methods

    async getUniversity(id: string): Promise<University> {
        return await this.dao.getById(id);
    }
}
