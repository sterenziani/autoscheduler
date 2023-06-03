import { ERRORS } from '../../constants/error.constants';
import Program from '../../models/abstract/program.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class ProgramDao extends GenericDao<Program> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.PROGRAM);
    }

    // Abstract Methods
    public abstract create(universityId: string, internalId: string, name: string): Promise<Program>;
    public abstract findByInternalId(universityId: string, internalId: string): Promise<Program | undefined>;
    public abstract findByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Program>>;
}
