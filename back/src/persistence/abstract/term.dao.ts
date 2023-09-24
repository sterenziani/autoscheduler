import { ERRORS } from '../../constants/error.constants';
import Term from '../../models/abstract/term.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class TermDao extends GenericDao<Term> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.TERM);
    }

    // Abstract Methods Signature Override
    public abstract create(universityId: string, internalId: string, name: string, startDate: Date, published: boolean): Promise<Term>;
    public abstract modify(id: string, universityIdFilter: string, internalId?: string, name?: string, startDate?: Date, published?: boolean): Promise<Term>;
    public abstract delete(id: string, universityIdFilter: string): Promise<void>;

    public abstract findById(id: string, universityIdFilter?: string): Promise<Term | undefined>;
    public abstract findPaginated(page: number, limit: number, textSearch?: string, from?: Date, to?: Date, published?: boolean, universityId?: string): Promise<PaginatedCollection<Term>>;

    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string): Promise<Term> {
        return await super.getById(id, universityIdFilter);
    }
}
