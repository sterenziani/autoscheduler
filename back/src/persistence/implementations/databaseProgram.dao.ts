import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRegex, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import Program from '../../models/abstract/program.model';
import DatabaseProgram from '../../models/implementations/databaseProgram.model';
import ProgramDao from '../abstract/program.dao';
import {v4 as uuidv4} from 'uuid';

const BELONGS_TO_PREFIX = 'P-U';
const IN_PREFIX = 'C-P';
const REQUIRES_PREFIX = 'C-C(P)';

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
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'MATCH (c)-[r:IN]->(p) ' +
                'SET r.optional = $optional',
                {id, universityId, courseId, optional}
            );
            const stats = getStats(result);
            if (stats.propertiesSet === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:modifyCourse]');
        } finally {
            await session.close();
        }
    }

    async removeCourse(id: string, universityId: string, courseId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'MATCH (c)-[r:IN]->(p) ' +
                'DELETE r',
                {id, universityId, courseId}
            );
            const stats = getStats(result);
            if (stats.relationshipsDeleted === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:removeCourse]');
        } finally {
            await session.close();
        }
    }

    async bulkAddCourses(id: string, universityId: string, mandatoryCoursesIds: string[], optionalCoursesIds: string[]): Promise<void> {
        const parsedCourses = this.parseCourses(mandatoryCoursesIds, optionalCoursesIds, id);
        if (parsedCourses.length === 0) return;

        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (p:Program {id: $id})-[:BELONGS_TO]->(u:University {id: $universityId}) ' +
                'UNWIND $parsedCourses as course ' +
                'MATCH (c:Course {id: course.id})-[:BELONGS_TO]->(u) ' +
                'CREATE (c)-[:IN {relId: course.relId, optional: course.optional}]->(p)',
                {id, universityId, parsedCourses}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:bulkAddCourses]', ERRORS.BAD_REQUEST.COURSE_ALREADY_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    async bulkReplaceCourses(id: string, universityId: string, mandatoryCoursesIds: string[], optionalCoursesIds: string[]): Promise<void> {
        const parsedCourses = this.parseCourses(mandatoryCoursesIds, optionalCoursesIds, id);

        const session = graphDriver.session();
        const transaction = session.beginTransaction();
        try {
            // We delete first since we are going to replace all the existing courses with the new courses
            const deleteResult = await transaction.run(
                'MATCH (p:Program {id: $id})-[:BELONGS_TO]->(:University {id: $universityId}) OPTIONAL MATCH ()-[r:IN]->(p) DELETE r RETURN p.id as id',
                {id, universityId}
            );
            const maybeId = getValue<string | undefined>(deleteResult, 'id');
            if (!maybeId) throw new GenericException(this.notFoundError);
            // If no new courses provided we commit transaction and return, there is no point in caling db again
            if (parsedCourses.length === 0) {
                await transaction.commit();
                return;
            }
            await transaction.run(
                'MATCH (p:Program {id: $id})->[:BELONGS_TO]->(u:University {id: $universityId}) ' +
                'UNWIND $parsedCourses as course ' +
                'MATCH (c:Course {id: course.id})-[:BELONGS_TO]->(u) ' +
                'CREATE (c)-[:IN {relId: course.relId, optional: course.optional}]->(p)',
                {id, universityId, parsedCourses}
            );
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw parseErrors(err, '[ProgramDao:bulkReplaceCourses]', ERRORS.BAD_REQUEST.COURSE_ALREADY_IN_PROGRAM);
        } finally {
            await transaction.close();
            await session.close();
        }
    }

    async addCourseRequiredCourse(id: string, universityId: string, courseId: string, requiredCourseId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(REQUI, courseId, id);
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'CREATE (c)-[:IN {relId: $relId, optional: $optional}]->(p)',
                {id, universityId, courseId, optional, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if either of the courses or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:addCourseRequiredCourse]', ERRORS.BAD_REQUEST.COURSE_ALREADY_REQUIRED_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    private nodeToProgram(node: any): DatabaseProgram {
        return new DatabaseProgram(node.id, deglobalizeField(node.internalId), node.name);
    }

    private parseCourses(mandatoryCoursesIds: string[], optionalCoursesIds: string[], programId: string) {
        const parsed: {id: string, optional: boolean, relId: string}[] = [];
        for (const id of mandatoryCoursesIds) {
            parsed.push({
                id,
                optional: false,
                relId: getRelId(IN_PREFIX, id, programId)
            });
        }
        for (const id of optionalCoursesIds) {
            parsed.push({
                id,
                optional: true,
                relId: getRelId(IN_PREFIX, id, programId)
            });
        }
        return parsed;
    }
}
