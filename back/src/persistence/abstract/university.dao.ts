import { ERRORS } from '../../constants/error.constants';
import University from '../../models/abstract/university.model';
import GenericDao from './generic.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';

export default abstract class UniversityDao extends GenericDao<University> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.UNIVERSITY);
    }

    // Abstract Methods Signature Override
    public abstract create(id: string, name: string, verified: boolean): Promise<University>;
    public abstract modify(id: string, name?: string, verified?: boolean): Promise<University>;
    
    public abstract findPaginated(page: number, limit: number, textSearch?: string, verified?: boolean): Promise<PaginatedCollection<University>>;
}
