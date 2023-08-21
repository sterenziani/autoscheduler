import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import Term from '../../../models/abstract/term.model';
import MemoryTerm from '../../../models/implementations/memory/memoryTerm.model';
import TermDao from '../../abstract/term.dao';
import { v4 as uuidv4 } from 'uuid';
import MemoryUniversityDao from './memoryUniversity.dao';
import {
    addChildToParent,
    getChildsFromParent,
    paginateCollection,
    removeChildFromParent,
} from '../../../helpers/persistence/memoryPersistence.helper';
import { PaginatedCollection } from '../../../interfaces/paging.interface';
import { ERRORS } from '../../../constants/error.constants';
import GenericException from '../../../exceptions/generic.exception';

export default class MemoryTermDao extends TermDao {
    private static instance: TermDao;

    static getInstance = () => {
        if (!MemoryTermDao.instance) {
            MemoryTermDao.instance = new MemoryTermDao();
        }
        return MemoryTermDao.instance;
    };

    // Abstract Methods Implementations
    public async create(
        universityId: string,
        internalId: string,
        name: string,
        published: boolean,
        startDate: Date,
    ): Promise<Term> {
        // We get the university to check that it exists
        const university = await MemoryUniversityDao.getInstance().getById(universityId);
        const newTerm = new MemoryTerm(uuidv4(), internalId, name, published, startDate);

        MEMORY_DATABASE.terms.set(newTerm.id, newTerm);
        addChildToParent(MEMORY_DATABASE.termsOfUniversity, university.id, newTerm.id);

        return newTerm;
    }

    public async findById(id: string): Promise<Term | undefined> {
        return MEMORY_DATABASE.terms.get(id);
    }

    public async findByInternalId(universityId: string, internalId: string): Promise<Term | undefined> {
        return getChildsFromParent(MEMORY_DATABASE.termsOfUniversity, MEMORY_DATABASE.terms, universityId).find(
            (t) => t.internalId === internalId,
        );
    }

    public async set(term: Term): Promise<void> {
        await this.getById(term.id);

        if (!(term instanceof MemoryTerm))
            term = new MemoryTerm(term.id, term.internalId, term.name, term.published, term.startDate);

        MEMORY_DATABASE.terms.set(term.id, term);
    }

    public async getByText(
        universityId: string,
        text?: string,
        published?: boolean,
        from?: Date,
        to?: Date,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Term>> {
        text = text ? text.toLowerCase() : text;
        let universityTerms = getChildsFromParent(
            MEMORY_DATABASE.termsOfUniversity,
            MEMORY_DATABASE.terms,
            universityId,
        );

        if (text)
            universityTerms = universityTerms.filter(
                (t) => t.name.toLowerCase().includes(text!) || t.internalId.toLowerCase().includes(text!),
            );

        if (published !== undefined) universityTerms = universityTerms.filter((t) => t.published === published);

        if (from !== undefined) universityTerms = universityTerms.filter((t) => t.startDate > from);

        if (to !== undefined) universityTerms = universityTerms.filter((t) => t.startDate <= to);

        // sorting by startDate then internalId
        const compareTerms = (t1: Term, t2: Term) => {
            if (t1.startDate < t2.startDate) return 1;
            if (t1.startDate > t2.startDate) return -1;

            if (t1.internalId < t2.internalId) return -1;
            if (t1.internalId > t2.internalId) return 1;
            return 0;
        };

        return paginateCollection(universityTerms, compareTerms, limit, offset);
    }

    public async deleteTerm(termId: string): Promise<void> {
        const term = await this.findById(termId);
        if (!term) throw new GenericException(ERRORS.NOT_FOUND.TERM);
        const university = await term.getUniversity();

        // TODO add session logic for transactional operations
        removeChildFromParent(MEMORY_DATABASE.termsOfUniversity, university.id, term.id);
        MEMORY_DATABASE.terms.delete(term.id);
    }
}
