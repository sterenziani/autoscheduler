import TermDao from '../persistence/abstract/term.dao';
import TermDaoFactory from '../factories/termDao.factory';
import Term from '../models/abstract/term.model';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class TermService {
    private static instance: TermService;

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
        // Do nothing
    }

    // public methods

    async getTerm(id: string, universityIdFilter?: string): Promise<Term> {
        return await this.dao.getById(id, universityIdFilter);
    }

    async getTerms(page: number, limit: number, textSearch?: string, from?: Date, to?: Date, published?: boolean, universityId?: string): Promise<PaginatedCollection<Term>> {
        return await this.dao.findPaginated(page, limit, textSearch, from, to, published, universityId);
    }

    async createTerm(universityId: string, internalId: string, name: string, startDate: Date, published: boolean): Promise<Term> {
        return await this.dao.create(universityId, internalId, name, startDate, published);
    }

    async modifyTerm(id: string, universityIdFilter: string, internalId?: string, name?: string, startDate?: Date, published?: boolean): Promise<Term> {
        return await this.dao.modify(id, universityIdFilter, internalId, name, startDate, published);
    }

    async deleteTerm(id: string, universityIdFilter: string): Promise<void> {
        return await this.dao.delete(id, universityIdFilter);
    }
}
