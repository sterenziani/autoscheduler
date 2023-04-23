import { PERSISTENCE } from "../constants/persistence/persistence.contants";
import ProgramDao from "../persistence/abstract/program.dao";
import MemoryProgramDao from "../persistence/implementations/memory/memoryProgram.dao";
import GenericDaoFactory from "./genericDao.factory";

export default class ProgramDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): ProgramDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryProgramDao.getInstance();
        }
    }
}