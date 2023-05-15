import { ERRORS } from '../../constants/error.constants';
import Term from '../../models/abstract/term.model';
import GenericDao from './generic.dao';

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
}
