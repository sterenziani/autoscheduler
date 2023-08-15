import TermDao from '../persistence/abstract/term.dao';
import TermDaoFactory from '../factories/termDao.factory';
import Term from '../models/abstract/term.model';
import UniversityService from './university.service';
import { PaginatedCollection } from '../interfaces/paging.interface';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export default class TermService {
    private static instance: TermService;
    private universityService!: UniversityService;

    private dao: TermDao;

    static getInstance(): TermService {
        if (!TermService.instance) {
            TermService.instance = new TermService();
        }
        return TermService.instance;
    }

    constructor() {
        this.dao = TermDaoFactory.get();
    }

    init() {
        this.universityService = UniversityService.getInstance();
    }

    async getTerm(id: string): Promise<Term> {
        return await this.dao.getById(id);
    }

    async getTerms(
        universityId: string,
        text?: string,
        published?: boolean,
        from?: Date,
        to?: Date,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Term>> {
        return await this.dao.getByText(universityId, text, published, from, to, limit, offset);
    }

    async createTerm(universityId: string, internalId: string, name: string, startDate: Date): Promise<Term> {
        const maybeUniversity = await this.universityService.getUniversity(universityId);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);

        if (await this.dao.findByInternalId(universityId, internalId))
            throw new GenericException(ERRORS.ALREADY_EXISTS.TERM);

        return await this.dao.create(universityId, internalId, name, false, startDate);
    }

    async deleteTerm(universityId: string, termId: string): Promise<void> {
        const maybeUniversity = await this.universityService.getUniversity(universityId);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);

        // validate permission
        if (maybeUniversity.id !== universityId) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        await this.dao.deleteTerm(termId);
    }

    async modifyTerm(
        id: string,
        universityId: string,
        internalId?: string,
        name?: string,
        published?: boolean,
        startDate?: Date,
    ): Promise<Term> {
        const term = await this.getTerm(id);
        if (!term) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);

        const maybeUniversity = await this.universityService.getUniversity(universityId);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);

        // validate permission
        if (maybeUniversity.id !== universityId) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        // validate internalId
        if (internalId && (await this.dao.findByInternalId(universityId, internalId)))
            throw new GenericException(ERRORS.ALREADY_EXISTS.TERM);

        if (internalId) term.internalId = internalId;
        if (name) term.name = name;
        if (published !== undefined) term.published = published;
        if (startDate) term.startDate = startDate;

        await this.dao.set(term);
        return term;
    }
}
