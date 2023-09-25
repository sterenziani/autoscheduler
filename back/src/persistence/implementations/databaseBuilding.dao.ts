import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import Building from '../../models/abstract/building.model';
import BuildingDao from '../abstract/building.dao';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import DatabaseBuilding from '../../models/implementations/databaseBuilding.model';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRegex, getRelId, getStats, getToIdFromRelId, getValue, globalizeField, graphDriver, logErrors, parseErrors, toGraphInt } from '../../helpers/persistence/graphPersistence.helper';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';
import { IBuildingDistance, IBuildingDistancesInput } from '../../interfaces/building.interface';
import { Integer } from 'neo4j-driver';

const BELONGS_TO_PREFIX = 'BU';
const DISTANCE_TO_PREFIX = 'BB';

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
                'CREATE CONSTRAINT building_internal_id_unique_constraint IF NOT EXISTS FOR (b: Building) REQUIRE b.internalId IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT distance_to_unique_constraint IF NOT EXISTS FOR ()-[r:DISTANCE_TO]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[BuildingDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
    
    async create(universityId: string, internalId: string, name: string): Promise<Building> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (b: Building {id: $id, internalId: $internalId, name: $name})-[:BELONGS_TO {relId: $relId}]->(u) RETURN b',
                {universityId, id, internalId, name, relId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToBuilding(node);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:create]', ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, universityId: string, internalId?: string, name?: string): Promise<Building> {
        const session = graphDriver.session();
        try {
            internalId = internalId ? globalizeField(universityId, internalId) : internalId;
            const baseQuery = buildQuery('MATCH (u: University {id: $universityId})<-[r:BELONGS_TO]-(b: Building {id: $id})', 'SET', ',', [
                {entry: 'b.internalId = $internalId', value: internalId},
                {entry: 'b.name = $name', value: name}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN b`,
                {id, universityId, internalId, name}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToBuilding(node);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:modify]', ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async delete(id: string, universityId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                `MATCH (:CourseClass)<-[lr:OF]-(l: Lecture)-[:TAKES_PLACE_IN]->(b: Building {id: $id})-[r]-() WHERE (b)-[:BELONGS_TO]->(: University {id: $universityId}) DELETE lr, r, l, b`,
                {id, universityId}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
            
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
    }

    async findById(id: string, universityId?: string): Promise<Building | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (b: Building {id: $id})', 'WHERE', 'AND', [
                {entry: '(b)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN b`,
                {id, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToBuilding(node);
        } catch (err) {
            logErrors(err, '[BuildingDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Building>> {
        // Initialize useful variables
        const collection: Building[] = [];
        let lastPage = 1;
        const regex = getRegex(textSearch);
        const globalRegex = getGlobalRegex(textSearch);

        const session = graphDriver.session();
        try {
            // Build query
            const baseQuery = buildQuery('MATCH (u: University)<-[:BELONGS_TO]-(b: Building)', 'WHERE', 'AND', [
                {entry: '(b.name =~ $regex OR b.internalId =~ $globalRegex)', value: textSearch},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(b) as count`,
                {regex, globalRegex, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN b ORDER BY b.name SKIP $skip LIMIT $limit`,
                    {regex, globalRegex, universityId, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToBuilding(node));
                }
            }
        } catch (err) {
            logErrors(err, '[BuildingDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    async findDistance(id: string, universityId: string, distancedBuildingId: string): Promise<IBuildingDistance | undefined> {
        if (id === distancedBuildingId) return {buildingId: id, distance: 0};
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (b: Building {id: $id})-[r: DISTANCE_TO]->(: Building {id: $distancedBuildingId})', 'WHERE', 'AND', [
                {entry: '(b)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN r`,
                {id, universityId, distancedBuildingId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToBuildingDistance(node);
        } catch (err) {
            logErrors(err, '[BuildingDao:findDistance]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findDistances(id: string, universityId: string): Promise<IBuildingDistance[]> {
        // Initialize useful variables
        const collection: IBuildingDistance[] = [{buildingId: id, distance: 0}];

        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (b: Building {id: $id})-[r: DISTANCE_TO]->(: Building)', 'WHERE', 'AND', [
                {entry: '(b)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN r`,
                {id, universityId}
            );
            const nodes = getNodes(result);
            for (const node of nodes) {
                collection.push(this.nodeToBuildingDistance(node));
            }
        } catch (err) {
            logErrors(err, '[BuildingDao:findDistances]');
        } finally {
            await session.close();
        }

        return collection;
    }

    async addDistance(id: string, universityId: string, distancedBuildingId: string, distance: number): Promise<IBuildingDistance> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(DISTANCE_TO_PREFIX, id, distancedBuildingId);
            const counterRelId = getRelId(DISTANCE_TO_PREFIX, distancedBuildingId, id);
            const result = await session.run(
                'MATCH (b: Building {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(db: Building {id: $distancedBuildingId}) ' +
                'CREATE (b)-[r:DISTANCE_TO {relId: $relId, distance: $distance}]->(db)-[:DISTANCE_TO {relId: $counterRelId, distance: $distance}]->(b) ' +
                'RETURN r',
                {id, universityId, distancedBuildingId, relId, counterRelId, distance}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToBuildingDistance(node);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:addDistance]', ERRORS.BAD_REQUEST.BUILDING_DISTANCE_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modifyDistance(id: string, universityId: string, distancedBuildingId: string, distance: number): Promise<IBuildingDistance> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(DISTANCE_TO_PREFIX, id, distancedBuildingId);
            const counterRelId = getRelId(DISTANCE_TO_PREFIX, distancedBuildingId, id);
            const result = await session.run(
                'MATCH ()-[i: DISTANCE_TO {relId: $counterRelId}]->(b: Building)-[o:DISTANCE_TO {relId: $relId}]->() ' +
                'WHERE (b)-[:BELONGS_TO]->(: University {id: $universityId}) ' +
                'SET i.distance = $distance, o.distance = $distance ' +
                'RETURN o',
                {relId, counterRelId, universityId, distance}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.BUILDING_DISTANCE);
            return this.nodeToBuildingDistance(node);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:modifyDistance]');
        } finally {
            await session.close();
        }
    }

    async removeDistance(id: string, universityId: string, distancedBuildingId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(DISTANCE_TO_PREFIX, id, distancedBuildingId);
            const counterRelId = getRelId(DISTANCE_TO_PREFIX, distancedBuildingId, id);
            const result = await session.run(
                'MATCH ()-[i: DISTANCE_TO {relId: $counterRelId}]->(b: Building)-[o:DISTANCE_TO {relId: $relId}]->() ' +
                'WHERE (b)-[:BELONGS_TO]->(: University {id: $universityId}) ' +
                'DELETE i, o',
                {relId, counterRelId, universityId}
            );
            const stats = getStats(result);
            if (stats.relationshipsDeleted === 0) throw new GenericException(ERRORS.NOT_FOUND.BUILDING_DISTANCE);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:removeDistance]');
        } finally {
            await session.close();
        }
    }

    async bulkAddDistances(id: string, universityId: string, distances: IBuildingDistancesInput): Promise<void> {
        const parsedDistances = this.parseBuildingDistancesInput(distances, id);

        const session = graphDriver.session();
        try {
            const result = await session.run(
                'UNWIND $parsedDistances as distance ' +
                'MATCH (b:Building {id: $id})-[:BELONGS_TO]->(:University {id: $universityId})<-[:BELONGS_TO]-(t:Building {id: distance.distancedBuildingId}) ' +
                'CREATE (b)-[:DISTANCE_TO {relId: distance.relId, distance: distance.distance}]->(t)-[:DISTANCE_TO {relId: distance.counterRelId, distance: distance.distance}]->(b)',
                {id, universityId, parsedDistances}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[BuildingDao:bulkAddDistances]', ERRORS.BAD_REQUEST.BUILDING_DISTANCE_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    // This is kind of heavy on the db, but whatever
    async bulkReplaceDistances(id: string, universityId: string, distances: IBuildingDistancesInput): Promise<void> {
        const parsedDistances = this.parseBuildingDistancesInput(distances, id);

        const session = graphDriver.session();
        const transaction = session.beginTransaction();
        try {
            // We delete first since we are going to replace all the existing distances with the new distances
            const deleteResult = await transaction.run(
                'MATCH (b:Building {id: $id})-[:BELONGS_TO]->(:University {id: $universityId}) OPTIONAL MATCH ()-[r:DISTANCE_TO]-(b) DELETE r RETURN b.id as id',
                {id, universityId}
            );
            const maybeId = getValue<string | undefined>(deleteResult, 'id');
            if (!maybeId) throw new GenericException(this.notFoundError);
            // If no new distances provided we commit transaction and return, there is no point in caling db again
            if (parsedDistances.length === 0) {
                await transaction.commit();
                return;
            }
            // TODO: I can match b just once
            await transaction.run(
                'UNWIND $parsedDistances as distance ' +
                'MATCH (b:Building {id: $id}), (t:Building {id: distance.distancedBuildingId}) ' +
                'CREATE (b)-[:DISTANCE_TO {relId: distance.relId, distance: distance.distance}]->(t)-[:DISTANCE_TO {relId: distance.counterRelId, distance: distance.distance}]->(b)',
                {id, parsedDistances}
            );
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw parseErrors(err, '[BuildingDao:bulkReplaceDistances]', ERRORS.BAD_REQUEST.BUILDING_DISTANCE_ALREADY_EXISTS);
        } finally {
            await transaction.close();
            await session.close();
        }
    }

    private nodeToBuilding(node: any): DatabaseBuilding {
        return new DatabaseBuilding(node.id, deglobalizeField(node.internalId), node.name);
    }

    private nodeToBuildingDistance(node: any): IBuildingDistance {
        return {
            buildingId: getToIdFromRelId(node.relId),
            distance: node.distance
        }
    }

    private parseBuildingDistancesInput(distances: IBuildingDistancesInput, buildingId: string) {
        const parsed: {distancedBuildingId: string, distance: Integer, relId: string, counterRelId: string}[] = [];
        for (const distancedBuildingId of Object.keys(distances)) {
            if (distancedBuildingId === buildingId) continue;
            parsed.push({
                distancedBuildingId,
                distance: toGraphInt(distances[distancedBuildingId]),
                relId: getRelId(DISTANCE_TO_PREFIX, buildingId, distancedBuildingId),
                counterRelId: getRelId(DISTANCE_TO_PREFIX, distancedBuildingId, buildingId)
            });
        }
        return parsed;
    }
}
