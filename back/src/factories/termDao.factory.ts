import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import TermDao from '../persistence/abstract/term.dao';
import MemoryTermDao from '../persistence/implementations/memory/memoryTerm.dao';
import GenericDaoFactory from './genericDao.factory';

export default class TermDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): TermDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryTermDao.getInstance();
        }
    }
}
