import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import Building from '../../models/abstract/building.model';
import BuildingDao from '../abstract/building.dao';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import DatabaseBuilding from '../../models/implementations/databaseBuilding.model';
import { buildQuery, getNode, getNodes, getRegex, getRelId, getStats, getToIdFromRelId, getValue, graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';
import { IBuildingDistance, IBuildingDistancesInput } from '../../interfaces/building.interface';
import ProgramDao from '../abstract/program.dao';
import DatabaseProgram from '../../models/implementations/databaseProgram.model';

export default class DatabaseProgramDao extends ProgramDao {
    private static instance: ProgramDao;

    static getInstance = () => {
        if (!DatabaseProgramDao.instance) {
            DatabaseProgramDao.instance = new DatabaseProgramDao();
        }
        return DatabaseProgramDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT program_id_unique_constraint IF NOT EXISTS FOR (p: Program) REQUIRE p.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT program_internal_id_unique_constraint IF NOT EXISTS FOR (p: Program) REQUIRE p.internalId IS UNIQUE'
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
            const relId = getRelId('BU', internalId, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (b: Building {id: $id, internalId: $internalId, name: $name, relId: $relId})-[:BELONGS_TO {relId: $relId}]->(u) RETURN b',
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
            const relId = getRelId('BU', internalId, universityId);
            const baseQuery = buildQuery('MATCH (u: University {id: $universityId})<-[r:BELONGS_TO]-(b: Building {id: $id})', 'SET', ',', [
                {entry: 'b.internalId = $internalId, b.relId = $relId, r.relId = $relId', value: internalId},
                {entry: 'b.name = $name', value: name}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN b`,
                {id, universityId, internalId, name, relId}
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
                `MATCH (:CourseClass)<-[lr:OF]-(l: Lecture)-[:TAKES_PLACES_IN]->(b: Building {id: $id})-[r]-() WHERE (b)-[:BELONGS_TO]->(: University {id: $universityId}) DELETE lr, r, l, b`,
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

        const session = graphDriver.session();
        try {
            // Build query
            const baseQuery = buildQuery('MATCH (u: University)<-[:BELONGS_TO]-(b: Building)', 'WHERE', 'AND', [
                {entry: '(b.name =~ $regex OR b.internalId =~ $regex)', value: textSearch},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(b) as count`,
                {regex, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN b ORDER BY b.name SKIP $skip LIMIT $limit`,
                    {regex, universityId, skip: getSkipFromPageLimit(page, limit), limit}
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
        const collection: IBuildingDistance[] = [];

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
            const relId = getRelId('BB', id, distancedBuildingId);
            const counterRelId = getRelId('BB', distancedBuildingId, id);
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
            const relId = getRelId('BB', id, distancedBuildingId);
            const counterRelId = getRelId('BB', distancedBuildingId, id);
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
            const relId = getRelId('BB', id, distancedBuildingId);
            const counterRelId = getRelId('BB', distancedBuildingId, id);
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

    private nodeToProgram(node: any): DatabaseProgram {
        return new DatabaseProgram(node.id, node.internalId, node.name);
    }

    private nodeToBuildingDistance(node: any): IBuildingDistance {
        return {
            buildingId: getToIdFromRelId(node.relId),
            distance: node.distance
        }
    }

    private parseBuildingDistancesInput(distances: IBuildingDistancesInput, buildingId: string) {
        const parsed: {distancedBuildingId: string, distance: number, relId: string, counterRelId: string}[] = [];
        for (const distancedBuildingId of Object.keys(distances)) {
            parsed.push({
                distancedBuildingId,
                distance: distances[distancedBuildingId],
                relId: getRelId('BB', buildingId, distancedBuildingId),
                counterRelId: getRelId('BB', distancedBuildingId, buildingId)
            });
        }
        return parsed;
    }
}
