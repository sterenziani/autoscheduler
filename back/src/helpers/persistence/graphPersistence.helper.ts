import neo4j, { Driver, Neo4jError } from 'neo4j-driver';
import { GRAPH_CONSTRAINT_ERROR_CODE } from '../../constants/persistence/databasePersistence.constants';
import { IErrorData } from '../../interfaces/error.interface';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';

export let graphDriver: Driver;

export const initializeGraphConnection = async (): Promise<void> => {
    graphDriver = neo4j.driver(
        `bolt://${process.env.NEO4J_HOST}:${process.env.NEO4J_PORT}`,
        neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'neo4j'),
        {disableLosslessIntegers: true}
    );
    return;
};

export const parseErrors = (err: unknown, logPrefix: string, constraintError?: IErrorData): void => {
    if (err instanceof GenericException) throw err;
    if (constraintError && err instanceof Neo4jError && err.code == GRAPH_CONSTRAINT_ERROR_CODE) throw new GenericException(constraintError);
    console.log(`${logPrefix}. Unknown error: ${JSON.stringify(err)}`);
    throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.DATABASE);
}

export const logErrors = (err: unknown, logPrefix: string): void => {
    console.log(`${logPrefix}. Unknown error: ${JSON.stringify(err)}`);
}