import { ERRORS } from '../../constants/error.constants';
import University from '../../models/abstract/university.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class UniversityDao extends GenericDao<University> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.UNIVERSITY);
    }

    // Abstract Methods
    public abstract create(userId: string, name: string, verified: boolean): Promise<University>;
    public abstract findByName(name: string): Promise<University | undefined>;
    public abstract findByText(
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<University>>;
}
