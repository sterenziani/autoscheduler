import TermDao from '../persistence/abstract/term.dao';

export default class TermDaoFactory {
    // Static Getters
    public static get(): TermDao {
        throw new Error('Not Implemented');
    }
}
