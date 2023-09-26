import neo4j, { Driver, Integer, Neo4jError, QueryResult, RecordShape, Date as Neo4jDate } from 'neo4j-driver';
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

export const getStats = (result: QueryResult<RecordShape>) => {
    return result.summary.counters.updates();
};

export const getNode = (result: QueryResult<RecordShape>): any => {
    return result.records[0]?.get(0)?.properties;
};

export const getNodes = (result: QueryResult<RecordShape>): any[] => {
    const nodes: any[] = [];
    for (const record of result.records) {
        const node = record.get(0)?.properties;
        if (!node) continue;
        nodes.push(node);
    }
    return nodes;
};

export const getValue = <T>(result: QueryResult<RecordShape>, key: string): T => {
    return result.records[0]?.get(key) as T;
};

export const buildQuery = (base: string, command: string, connector: string, entries: IQueryEntry[]): string => {
    let filter: string | undefined = undefined;
    for (const entry of entries) {
        if (entry.value === undefined) continue;
        if (filter === undefined) filter = command;
        filter = filter + ` ${entry.entry}${connector}`
    }
    if (filter === undefined) return base;
    const trimmedFilter = filter.slice(0, -1 * connector.length);
    return `${base} ${trimmedFilter}`
};

export const getRegex = (textSearch?: string): string => {
    return `(?i).*${textSearch}.*`;
};

export const getGlobalRegex = (textSearch?: string): string => {
    return `(?i).+--.*${textSearch}.*`;
};

// relId is for relationships, for them to be unique and also makes some particular queries easier
export const getRelId = (prefix: string, fromId: string, toId: string, underId?: string): string => {
    return `${prefix}--${fromId}--${toId}${underId ? `--${underId}` : ''}`;
};

export const getToIdFromRelId = (relId: string): string => {
    const splitRelId = relId.split('--');
    return splitRelId[2] as string;
};

export const getFromIdFromRelId = (relId: string): string => {
    const splitRelId = relId.split('--');
    return splitRelId[1] as string;
};

export const getunderIdFromRelId = (relId: string): string | undefined => {
    const splitRelId = relId.split('--');
    if (splitRelId.length !== 4) return undefined;
    return splitRelId[3] as string;
};

// these helpers globalizes and deglobalizes properties that should be unique only within the scope of a university (basically just internalId)
export const globalizeField = (parentId: string, field: string): string => {
    return `${parentId}--${field}`;
};

export const deglobalizeField = (globalizedField: string): string => {
    const splitted = globalizedField.split('--');
    const cleaned = splitted.splice(1);
    return cleaned.join('');
};

// Neo4j doesnt work well with integers, so we have to transform them somtimes
export const toGraphInt = (value: number): Integer => {
    return neo4j.int(value);
};

export const toGraphDate = (value: Date): Neo4jDate<number> => {
    return Neo4jDate.fromStandardDate(value);
};

export const parseGraphDate = (value: Neo4jDate): Date => {
    return value.toStandardDate();
};