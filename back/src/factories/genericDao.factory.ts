import { PERSISTENCE } from "../constants/persistence/persistence.contants";

export default abstract class GenericDaoFactory {
    // Protected static helpers
    protected static getPersistence(): PERSISTENCE {
        return (process.env.PERSISTENCE ?? "MEMORY") as PERSISTENCE;
    }
}