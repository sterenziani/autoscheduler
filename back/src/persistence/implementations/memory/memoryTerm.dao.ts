import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import Term from '../../../models/abstract/term.model';
import MemoryTerm from '../../../models/implementations/memory/memoryTerm.model';
import TermDao from '../../abstract/term.dao';
import { v4 as uuidv4 } from 'uuid';
import MemoryUniversityDao from './memoryUniversity.dao';
import { addChildToParent } from '../../../helpers/persistence/memoryPersistence.helper';

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

    public async set(term: Term): Promise<void> {
        await this.getById(term.id);

        if (!(term instanceof MemoryTerm))
            term = new MemoryTerm(term.id, term.internalId, term.name, term.published, term.startDate);

        MEMORY_DATABASE.terms.set(term.id, term);
    }
}
