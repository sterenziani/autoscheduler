import { ERRORS } from '../../constants/error.constants';
import Term from '../../models/abstract/term.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class TermDao extends GenericDao<Term> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.TERM);
    }

    // Abstract Methods
    public abstract create(
        universityId: string,
        internalId: string,
        name: string,
        published: boolean,
        startDate: Date,
    ): Promise<Term>;
    public abstract findByInternalId(universityId: string, internalId: string): Promise<Term | undefined>;
    public abstract getByText(
        universityId: string,
        text?: string,
        published?: boolean,
        from?: Date,
        to?: Date,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Term>>;
    public abstract deleteTerm(termId: string): Promise<void>;
}
