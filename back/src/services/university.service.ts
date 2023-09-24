import UniversityDaoFactory from '../factories/universityDao.factory';
import University from '../models/abstract/university.model';
import UniversityDao from '../persistence/abstract/university.dao';
import UserService from './user.service';
import EmailService from './email.service';
import { ROLE } from '../constants/general.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class UniversityService {
    private static instance: UniversityService;
    private readonly universityDefaultVerified: boolean = false;

    private dao: UniversityDao;
    private userService!: UserService;
    private emailService!: EmailService;

    static getInstance(): UniversityService {
        if (!UniversityService.instance) {
            UniversityService.instance = new UniversityService();
        }
        return UniversityService.instance;
    }

    constructor() {
        this.dao = UniversityDaoFactory.get();
    }

    init() {
        this.userService = UserService.getInstance();
        this.emailService = EmailService.getInstance();
    }

    // public methods

    async getUniversity(id: string): Promise<University> {
        return await this.dao.getById(id);
    }

    async getUniversities(page: number, limit: number, textSearch?: string, verified?: boolean): Promise<PaginatedCollection<University>> {
        return await this.dao.findPaginated(page, limit, textSearch, verified);
    }

    async createUniversityExistingUser(userId: string, userEmail: string, userLocale: string, name: string, updateRole = true): Promise<University> {
        // create university
        const university = await this.dao.create(userId, name, this.universityDefaultVerified);
        // update user role (if necessary)
        if (updateRole) {
            await this.userService.modifyUser(userId, undefined, undefined, undefined, ROLE.UNIVERSITY);
        }
        // send welcome email
        this.emailService.sendUniversityWelcomeEmail(userEmail, userLocale, university)
            .catch((err) => console.log(`[UniversityService:createUniversity] Failed to send university welcome email. ${JSON.stringify(err)}`));
        return university;
    }

    async createUniversity(email: string, password: string, locale: string, name: string): Promise<University> {
        // create user
        const user = await this.userService.createUser(email, password, ROLE.UNIVERSITY, locale);
        // create university
        return await this.createUniversityExistingUser(user.id, user.email, user.locale, name, false);
    }

    async modifyUniversity(id: string, name?: string, verified?: boolean): Promise<University> {
        const university = await this.dao.modify(id, name, verified);
        if (verified === true) {
            university.getUser()
                .then((u) => {return this.emailService.sendUniversityVerifiedEmail(u, university)})
                .catch((err) => console.log(`[UniversityService:modifyUniversity] Failed to send university verified email. ${JSON.stringify(err)}`))
        }
        return university;
    }
}
