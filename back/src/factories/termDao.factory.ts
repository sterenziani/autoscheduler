import TermDao from '../persistence/abstract/term.dao';
import DatabaseTermDao from '../persistence/implementations/databaseTerm.dao';

export default class TermDaoFactory {
    // Static Getters
    public static get(): TermDao {
        return DatabaseTermDao.getInstance();
    }
}
