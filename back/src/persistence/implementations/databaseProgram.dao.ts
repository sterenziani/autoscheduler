import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRegex, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import { cleanMaybeText, decodeText, encodeText } from '../../helpers/string.helper';
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
            const promises: Promise<any>[] = [];
            // Constraints
            promises.push(session.run(
                'CREATE CONSTRAINT program_id_unique_constraint IF NOT EXISTS FOR (p: Program) REQUIRE p.id IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT program_internal_id_unique_constraint IF NOT EXISTS FOR (p: Program) REQUIRE p.internalId IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT in_unique_constraint IF NOT EXISTS FOR ()-[r:IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            // Indexes
            promises.push(session.run(
                'CREATE TEXT INDEX program_name_text_index IF NOT EXISTS FOR (p: Program) ON (p.name)'
            ));
            await Promise.allSettled(promises);
        } catch (err) {
            console.log(`[BuildingDao] Warning: Failed to create constraints and indexes. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, internalId: string, name: string): Promise<Program> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const encodedName = encodeText(name);
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (p: Program {id: $id, internalId: $internalId, name: $name, encoding: $encoding})-[:BELONGS_TO {relId: $relId}]->(u) RETURN p',
                {universityId, id, internalId, name: encodedName.cleanText, encoding: encodedName.encoding, relId}
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
            const encodedName = name ? encodeText(name) : undefined;
            internalId = internalId ? globalizeField(universityId, internalId) : undefined;
            const baseQuery = buildQuery('MATCH (p: Program {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})', 'SET', ',', [
                {entry: 'p.internalId = $internalId', value: internalId},
                {entry: 'p.name = $name, p.encoding = $encoding', value: name}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN p`,
                {universityId, id, internalId, name: encodedName?.cleanText, encoding: encodedName?.encoding}
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
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (p:Program {id: $id})-[b:BELONGS_TO]->(:University {id: $universityId}) ' +
                'OPTIONAL MATCH ()-[i:IN]->(p), ()-[r:REQUIRES {programId: $id}]->() ' +
                'DELETE b, i, r, p',
                {id, universityId}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
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

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (u: University)<-[:BELONGS_TO]-(p: Program)', 'WHERE', 'AND', [
                {entry: '(p.name CONTAINS $textSearch OR p.internalId =~ $globalRegex)', value: textSearch},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(p) as count`,
                {textSearch, globalRegex, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN p ORDER BY p.name SKIP $skip LIMIT $limit`,
                    {textSearch, globalRegex, universityId, skip: getSkipFromPageLimit(page, limit), limit}
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
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
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
            const relId = getRelId(REQUIRES_PREFIX, courseId, requiredCourseId, id);
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(: University {id: $universityId}) ' +
                'OPTIONAL MATCH (c: Course {id: $courseId})-[:IN]->(p)<-[:IN]-(rc: Course {id: $requiredCourseId}) ' +
                'CREATE (c)-[:REQUIRES {relId: $relId, programId: $id}]->(rc) ' +
                'RETURN p.id as id',
                {id, universityId, courseId, requiredCourseId, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) {
                const maybeId = getValue<string | undefined>(result, 'id');
                throw new GenericException(maybeId ? ERRORS.NOT_FOUND.COURSE : ERRORS.NOT_FOUND.PROGRAM);
            }
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:addCourseRequiredCourse]', ERRORS.BAD_REQUEST.COURSE_ALREADY_REQUIRED_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    async removeCourseRequiredCourse(id: string, universityId: string, courseId: string, requiredCourseId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(REQUIRES_PREFIX, courseId, requiredCourseId, id);
            const result = await session.run(
                'MATCH (p: Program {id: $id})-[:BELONGS_TO]->(: University {id: $universityId}) ' +
                'OPTIONAL MATCH ()-[r:REQUIRES {relId: $relId, programId: $id}]->() ' +
                'DELETE r ' +
                'RETURN p.id as id',
                {id, universityId, courseId, requiredCourseId, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsDeleted === 0) {
                const maybeId = getValue<string | undefined>(result, 'id');
                throw new GenericException(maybeId ? ERRORS.NOT_FOUND.COURSE_REQUIREMENT : ERRORS.NOT_FOUND.PROGRAM);
            }
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:removeCourseRequiredCourse]', ERRORS.BAD_REQUEST.COURSE_ALREADY_REQUIRED_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    async bulkAddCourseRequiredCourses(id: string, universityId: string, courseId: string, requirements: string[]): Promise<void> {
        const parsedCourses = this.parseRequiredCourses(requirements, courseId, id);
        if (parsedCourses.length === 0) return;

        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (c:Course {id: $courseId})-[:IN]->(p:Program {id: $id})-[:BELONGS_TO]->(:University {id: $universityId}) ' +
                'UNWIND $parsedCourses as course ' +
                'MATCH (rc:Course {id: course.id})-[:IN]->(p) ' +
                'CREATE (c)-[:REQUIRES {relId: course.relId, programId: $id}]->(rc)',
                {id, universityId, parsedCourses}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or required course or program was not found
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:bulkAddCourseRequiredCourses]', ERRORS.BAD_REQUEST.COURSE_ALREADY_REQUIRED_IN_PROGRAM);
        } finally {
            await session.close();
        }
    }

    async bulkReplaceCourseRequiredCourses(id: string, universityId: string, courseId: string, requirements: string[]): Promise<void> {
        const parsedCourses = this.parseRequiredCourses(requirements, courseId, id);

        const session = graphDriver.session();
        const transaction = session.beginTransaction();
        try {
            // We delete first since we are going to replace all the existing course requirements with the new requirements
            const deleteResult = await transaction.run(
                'MATCH (c:Course {id: $courseId})-[:IN]->(p:Program {id: $id})-[:BELONGS_TO]->(:University {id: $universityId}) ' +
                'OPTIONAL MATCH (c)-[r:REQUIRES {programId: $id}]->() ' +
                'DELETE r ' +
                'RETURN c.id as id',
                {id, universityId, courseId}
            );
            const maybeId = getValue<string | undefined>(deleteResult, 'id');
            if (!maybeId) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
            // If no new requirements provided we commit transaction and return, there is no point in caling db again
            if (parsedCourses.length === 0) {
                await transaction.commit();
                return;
            }
            await transaction.run(
                'MATCH (c:Course {id: $courseId})-[:IN]->(p:Program {id: $id}) ' +
                'UNWIND $parsedCourses as course ' +
                'MATCH (rc:Course {id: course.id})-[:IN]->(p) ' +
                'CREATE (c)-[:REQUIRES {relId: course.relId, programId: $id}]->(rc)',
                {id, courseId, parsedCourses}
            );
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw parseErrors(err, '[ProgramDao:bulkReplaceCourseRequiredCourses]', ERRORS.BAD_REQUEST.COURSE_ALREADY_REQUIRED_IN_PROGRAM);
        } finally {
            await transaction.close();
            await session.close();
        }
    }

    private nodeToProgram(node: any): DatabaseProgram {
        return new DatabaseProgram(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding));
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

    private parseRequiredCourses(courseIds: string[], courseId: string, programId: string) {
        const parsed: {id: string, relId: string}[] = [];
        for (const id of courseIds) {
            parsed.push({
                id,
                relId: getRelId(REQUIRES_PREFIX, courseId, id, programId)
            });
        }
        return parsed;
    }
}
