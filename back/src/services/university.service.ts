import UniversityDaoFactory from '../factories/universityDao.factory';
import University from '../models/abstract/university.model';
import UniversityDao from '../persistence/abstract/university.dao';
import UserService from './user.service';
import EmailService from './email.service';
import { ROLE } from '../constants/general.constants';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
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

    async createUniversity(email: string, password: string, name: string, locale: string|undefined): Promise<University> {
        // validate name
        if (!name) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
        if (await this.dao.findByName(name)) throw new GenericException(ERRORS.BAD_REQUEST.UNIVERSITY_ALREADY_EXISTS);

        // create user
        const user = await this.userService.createUser(email, password, ROLE.UNIVERSITY);
        // create University
        const university = await this.dao.create(user.id, name, this.universityDefaultVerified);
        this.emailService.sendUniversityWelcomeEmail(university.email, university.name, locale);
        return university;
    }

    async setUniversityVerificationStatus(id: string, verified: boolean): Promise<University> {
        const university: University = await this.getUniversity(id);
        const oldStatus = university.verified;

        university.verified = verified;
        await this.dao.set(university);

        if(!oldStatus && verified)
            this.emailService.sendUniversityVerifiedEmail(university.email, university.name, "en");
        return university;
    }

    async getUniversitiesByText(
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<University>> {
        return await this.dao.findByText(text, limit, offset);
    }
}
