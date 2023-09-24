import ProgramDao from '../persistence/abstract/program.dao';

export default class ProgramDaoFactory {
    // Static Getters
    public static get(): ProgramDao {
        throw new Error('Not Implemented');
    }
}
