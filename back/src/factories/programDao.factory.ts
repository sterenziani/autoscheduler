import ProgramDao from '../persistence/abstract/program.dao';
import DatabaseProgramDao from '../persistence/implementations/databaseProgram.dao';

export default class ProgramDaoFactory {
    // Static Getters
    public static get(): ProgramDao {
        return DatabaseProgramDao.getInstance();
    }
}
