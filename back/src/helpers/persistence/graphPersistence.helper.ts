import neo4j, { Driver } from 'neo4j-driver';

export let graphDriver: Driver;

export const initializeGraphConnection = async (): Promise<void> => {
    graphDriver = neo4j.driver(
        `bolt://${process.env.NEO4J_HOST}:${process.env.NEO4J_PORT}`,
        neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'neo4j'),
    );
    return;
};
