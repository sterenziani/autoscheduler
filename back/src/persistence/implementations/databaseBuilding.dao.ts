import { simplePaginateCollection } from '../../helpers/collection.helper';
import { cleanText, removeSpecialCharacters } from '../../helpers/string.helper';
import Building from '../../models/abstract/building.model';
import BuildingDao from '../abstract/building.dao';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import DatabaseBuilding from '../../models/implementations/databaseBuilding.model';
import { graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';

export default class DatabaseBuildingDao extends BuildingDao {
    private static instance: BuildingDao;

    static getInstance = () => {
        if (!DatabaseBuildingDao.instance) {
            DatabaseBuildingDao.instance = new DatabaseBuildingDao();
        }
        return DatabaseBuildingDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT building_id_unique_constraint IF NOT EXISTS FOR (b: Building) REQUIRE b.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT building_internal_id_unique_constraint IF NOT EXISTS FOR (b: Building) REQUIRE b.relId IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT distance_to_unique_constraint IF NOT EXISTS FOR ()-[r:DISTANCE_TO]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[BuildingDao] Warning: Failed to set constraints`);
        } finally {
            await session.close();
        }
    }
    
    async create(universityId: string, internalId: string, name: string): Promise<Building> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const relId = `BU${universityId}${internalId}`;
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (b: Building {id: $id, internalId: $internalId, name: $name, relId: $relId})-[:BELONGS_TO {relId: $relId}]->(u) RETURN b',
                {universityId, id, internalId, name, relId}
            );
            const node = result.records[0]?.get(0)?.properties;
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToBuilding(node);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:create]', ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Building> {
        
    }

    public async findById(id: string): Promise<Building | undefined> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (b: Building) WHERE b.id = $id RETURN b',
                {id}
            );
            const node = result.records[0]?.get(0)?.properties;
            if (!node) return undefined;

            return new DatabaseBuilding(node.id, node.internalId, node.name);
        } catch (err) {
            console.log(`[BuildingDao:findById]. Error: ${JSON.stringify(err)}`);
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async findByUniversityId(universityId: string): Promise<Building[]> {
        const buildings: Building[] = [];
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (b: Building)-[:BELONGS_TO]->(u: University {id: $universityId}) RETURN b',
                {universityId}
            );
            for (const record of result.records) {
                const node = record.get(0)?.properties;
                if (!node) continue;
                buildings.push(new DatabaseBuilding(node.id, node.internalId, node.name));
            }

        } catch (err) {
            console.log(`[BuildingDao:findByUniversityId]. Error: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }

        return buildings;
    }

    public async findByInternalId(universityId: string, internalId: string): Promise<Building | undefined> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (b: Building {internalId: $internalId})-[:BELONGS_TO]->(u: University {id: $universityId}) RETURN b',
                {universityId, internalId}
            );
            const node = result.records[0]?.get(0)?.properties;
            if (!node) return undefined;

            return new DatabaseBuilding(node.id, node.internalId, node.name);
        } catch (err) {
            console.log(`[BuildingDao:findByInternalId]. Error: ${JSON.stringify(err)}`);
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async set(building: Building): Promise<void> {
        building.name = cleanText(building.name);
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (b: Building {id: $id})-[r:BELONGS_TO]->(u: University) SET b.name = $name, b.internalId = $internalId, r.id = "BU" + u.id + $internalId',
                {id: building.id, name: building.name, internalId: building.internalId}
            );
            if (result.summary.counters.updates().propertiesSet == 0) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
        } catch (err) {
            parseErrors(err, '[BuildingDao:set]', ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS)
        } finally {
            await session.close();
        }
    }

    public async getUniversityBuildingsByText(
        universityId: string,
        limit: number,
        offset: number,
        text?: string,
    ): Promise<PaginatedCollection<Building>> {
        const regex = `.*${cleanText(text ?? '')}.*`;
        const buildings: Building[] = [];
        let totalEntries = 0;

        const session = graphDriver.session();
        try {
            // Since this is paginated, we need to count as well (So much for performance improvements by using graphs i guess)
            // Making 2 separate queries is faster than combining everything in one, cuz neo4j is neo4j
            const countResult = await session.run(
                `MATCH (b: Building)-[:BELONGS_TO]->(u: University {id: $universityId}) WHERE b.name =~ $regex OR toLower(b.internalId) =~ $regex RETURN count(b) as count`,
                {universityId, regex}
            );
            totalEntries = countResult.records[0].get('count') as number;
            const result = await session.run(
                `MATCH (b: Building)-[:BELONGS_TO]->(u: University {id: $universityId}) WHERE b.name =~ $regex OR toLower(b.internalId) =~ $regex RETURN b ORDER BY b.internalId SKIP $offset LIMIT $limit`,
                {regex, limit, offset: limit * (offset - 1)}
            );
            for (const record of result.records) {
                const node = record.get(0)?.properties;
                if (!node) continue;
                buildings.push(new DatabaseBuilding(node.id, node.internalId, node.name));
            }
        } catch (err) {
            console.log(`[BuildingDao:getUniversityBuildingsByText]. Error: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }

        return simplePaginateCollection(buildings, totalEntries, limit, offset);
    }

    public async deleteBuilding(id: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (b: Building {id: $id})-[r:BELONGS_TO]->(u:University) DELETE r, b',
                {id}
            );
            if (result.summary.counters.updates().nodesDeleted == 0) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
        } catch (err) {
            parseErrors(err, '[BuildingDato:deleteBuilding]', ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    private nodeToBuilding(node: any): DatabaseBuilding {
        return new DatabaseBuilding(node.id, node.internalId, node.name);
    }
}
