import neo4j, { Driver, Neo4jError } from 'neo4j-driver';
import { GRAPH_CONSTRAINT_ERROR_CODE } from '../../constants/persistence/graphPersistence.constants';
import { IErrorData } from '../../interfaces/error.interface';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';
import { IQueryEntry } from '../../interfaces/persistence.interface';

export let graphDriver: Driver;

export const initializeGraphConnection = async (): Promise<void> => {
    graphDriver = neo4j.driver(
        `bolt://${process.env.NEO4J_HOST}:${process.env.NEO4J_PORT}`,
        neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'neo4j'),
        {disableLosslessIntegers: true}
    );
    return;
};

export const parseErrors = (err: unknown, logPrefix: string, constraintError?: IErrorData): GenericException => {
    if (err instanceof GenericException) return err;
    if (constraintError && err instanceof Neo4jError && err.code == GRAPH_CONSTRAINT_ERROR_CODE) return new GenericException(constraintError);
    logErrors(err, logPrefix);
    return new GenericException(ERRORS.INTERNAL_SERVER_ERROR.DATABASE);
};

export const logErrors = (err: unknown, logPrefix: string): void => {
    console.log(`${logPrefix}. Unknown error: ${JSON.stringify(err)}`);
};

export const buildQuery = (entries: IQueryEntry[], command: string): string => {
    let base: string | undefined = undefined;
    for (const entry of entries) {
        if (entry.value === undefined) continue;
        if (base === undefined) base = command;
        base = base + ` ${entry.entry},`
    }
    if (base === undefined) return '';
    return base.slice(0, -1);
};

export const getRegex = (textSearch?: string): string => {
    return `.*${textSearch}.*`;
};