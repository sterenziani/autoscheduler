import TermDao from '../persistence/abstract/term.dao';
import TermDaoFactory from '../factories/termDao.factory';
import Term from '../models/abstract/term.model';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { cleanMaybeText, cleanText } from '../helpers/string.helper';

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
        return await this.dao.findPaginated(page, limit, cleanMaybeText(textSearch), from, to, published, universityId);
    }

    async createTerm(universityId: string, internalId: string, name: string, startDate: Date, published: boolean): Promise<Term> {
        return await this.dao.create(universityId, cleanText(internalId), cleanText(name), startDate, published);
    }

    async modifyTerm(id: string, universityIdFilter: string, internalId?: string, name?: string, startDate?: Date, published?: boolean): Promise<Term> {
        return await this.dao.modify(id, universityIdFilter, cleanMaybeText(internalId), cleanMaybeText(name), startDate, published);
    }

    async deleteTerm(id: string, universityIdFilter: string): Promise<void> {
        return await this.dao.delete(id, universityIdFilter);
    }
}
