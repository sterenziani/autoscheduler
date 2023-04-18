import { PERSISTENCE } from "../constants/persistence/persistence.contants";
import MemoryPersistenceService from "../services/persistence/implementations/memory/memoryPersistence.service";
import PersistenceService from "../services/persistence/persistence.service";

export default class PersistenceFactory {
    static getByEnum(persistence: PERSISTENCE): PersistenceService {
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryPersistenceService.getInstance();
        }
    }

    static get(): PersistenceService {
        const persistence: PERSISTENCE = (process.env.PERSISTENCE ?? "MEMORY") as PERSISTENCE;
        return this.getByEnum(persistence);
    }
}