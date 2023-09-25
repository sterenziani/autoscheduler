import UniversityDaoFactory from '../factories/universityDao.factory';
import University from '../models/abstract/university.model';
import UniversityDao from '../persistence/abstract/university.dao';
import UserService from './user.service';
import EmailService from './email.service';
import { ROLE } from '../constants/general.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { cleanMaybeText, cleanText } from '../helpers/string.helper';

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
        return await this.dao.findPaginated(page, limit, cleanMaybeText(textSearch), verified);
    }

    async createUniversity(email: string, password: string, locale: string, name: string): Promise<University> {
        // create user
        const user = await this.userService.createUser(email, password, locale, ROLE.UNIVERSITY);
        // create university
        const university = await this.dao.create(user.id, cleanText(name), this.universityDefaultVerified);
        // send welcome email
        this.emailService.sendUniversityWelcomeEmail(user.email, user.locale, university)
            .catch((err) => console.log(`[UniversityService:createUniversity] Failed to send university welcome email. ${JSON.stringify(err)}`));
        return university;
    }

    async modifyUniversity(id: string, name?: string, verified?: boolean): Promise<University> {
        const university = await this.dao.modify(id, cleanMaybeText(name), verified);
        if (verified === true) {
            this.userService.getUser(university.id)
                .then((u) => {return this.emailService.sendUniversityVerifiedEmail(u, university)})
                .catch((err) => console.log(`[UniversityService:modifyUniversity] Failed to send university verified email. ${JSON.stringify(err)}`))
        }
        return university;
    }
}
