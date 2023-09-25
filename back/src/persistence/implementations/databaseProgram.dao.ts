import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRegex, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import Program from '../../models/abstract/program.model';
import DatabaseProgram from '../../models/implementations/databaseProgram.model';
import ProgramDao from '../abstract/program.dao';
import {v4 as uuidv4} from 'uuid';

const BELONGS_TO_PREFIX = 'PU';
const IN_PREFIX = 'CP';

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
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT in_unique_constraint IF NOT EXISTS FOR ()-[r:IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[BuildingDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, internalId: string, name: string): Promise<Program> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (p: Program {id: $id, internalId: $internalId, name: $name})-[:BELONGS_TO {relId: $relId}]->(u) RETURN p',
                {universityId, id, internalId, name, relId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToProgram(node);
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:create]', ERRORS.BAD_REQUEST.PROGRAM_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, universityId: string, internalId?: string, name?: string): Promise<Program> {
        const session = graphDriver.session();
        try {
            internalId = internalId ? globalizeField(universityId, internalId) : internalId;
            const baseQuery = buildQuery('MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})', 'SET', ',', [
                {entry: 'p.internalId = $internalId', value: internalId},
                {entry: 'p.name = $name', value: name}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN p`,
                {universityId, id, internalId, name}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToProgram(node);
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:modify]', ERRORS.BAD_REQUEST.PROGRAM_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    // Never used
    async delete(id: string, universityId: string): Promise<void> {
        throw new Error('Not implemented');
    }

    async findById(id: string, universityId?: string): Promise<Program | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (p: Program {id: $id})', 'WHERE', 'AND', [
                {entry: '(p)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN p`,
                {id, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToProgram(node);
        } catch (err) {
            logErrors(err, '[ProgramDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Program>> {
        // Initialize useful variables
        const collection: DatabaseProgram[] = [];
        let lastPage = 1;
        const regex = getRegex(textSearch);
        const globalRegex = getGlobalRegex(textSearch);

        const session = graphDriver.session();
        try {
            // Build query
            const baseQuery = buildQuery('MATCH (u: University)<-[:BELONGS_TO]-(p: Program)', 'WHERE', 'AND', [
                {entry: '(p.name =~ $regex OR p.internalId =~ $globalRegex)', value: textSearch},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(p) as count`,
                {regex, globalRegex, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN p ORDER BY p.name SKIP $skip LIMIT $limit`,
                    {regex, globalRegex, universityId, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToProgram(node));
                }
            }
        } catch (err) {
            logErrors(err, '[ProgramDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    async addCourse(id: string, universityId: string, courseId: string, optional: boolean): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(IN_PREFIX, courseId, id);
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'CREATE (c)-[:IN {relId: $relId, optional: $optional}]->(p)',
                {id, universityId, courseId, optional, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:addCourse]', ERRORS.BAD_REQUEST.COURSE_ALREADY_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    async modifyCourse(id: string, universityId: string, courseId: string, optional: boolean): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(IN_PREFIX, courseId, id);
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'MATCH (c)-[r:IN]->(p) ' +
                'SET r.optional = $optional',
                {id, universityId, courseId, optional, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:addCourse]', ERRORS.BAD_REQUEST.COURSE_ALREADY_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    private nodeToProgram(node: any): DatabaseProgram {
        return new DatabaseProgram(node.id, deglobalizeField(node.internalId), node.name);
    }
}
