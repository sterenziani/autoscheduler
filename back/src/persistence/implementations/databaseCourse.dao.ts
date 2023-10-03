import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors, getToIdFromRelId } from '../../helpers/persistence/graphPersistence.helper';
import { cleanMaybeText, decodeText, encodeText } from '../../helpers/string.helper';
import { IProgramRequiredCredits } from '../../interfaces/course.interface';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import Course from '../../models/abstract/course.model';
import DatabaseCourse from '../../models/implementations/databaseCourse.model';
import CourseDao from '../abstract/course.dao';
import {v4 as uuidv4} from 'uuid';

const BELONGS_TO_PREFIX = 'C-U';

export default class DatabaseCourseDao extends CourseDao {
    private static instance: CourseDao;

    static getInstance = () => {
        if (!DatabaseCourseDao.instance) {
            DatabaseCourseDao.instance = new DatabaseCourseDao();
        }
        return DatabaseCourseDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const promises: Promise<any>[] = [];
            // Constraints
            promises.push(session.run(
                'CREATE CONSTRAINT course_id_unique_constraint IF NOT EXISTS FOR (c: Course) REQUIRE c.id IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT course_internal_id_unique_constraint IF NOT EXISTS FOR (c: Course) REQUIRE c.internalId IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT requires_unique_constraint IF NOT EXISTS FOR ()-[r:REQUIRES]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT of_unique_constraint IF NOT EXISTS FOR ()-[r:OF]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            // Indexes
            promises.push(session.run(
                'CREATE TEXT INDEX course_name_text_index IF NOT EXISTS FOR (c: Course) ON (c.name)'
            ));
            await Promise.allSettled(promises);
        } catch (err) {
            console.log(`[CourseDao] Warning: Failed to create constraints and indexes. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, internalId: string, name: string, creditValue: number): Promise<Course> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const encodedName = encodeText(name);
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (c: Course {id: $id, internalId: $internalId, name: $name, encoding: $encoding, creditValue: $creditValue})-[:BELONGS_TO {relId: $relId}]->(u) RETURN c',
                {universityId, id, internalId, name: encodedName.cleanText, encoding: encodedName.encoding, creditValue, relId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToCourse(node);
        } catch (err) {
            throw parseErrors(err, '[CourseDao:create]', ERRORS.BAD_REQUEST.COURSE_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, universityId: string, internalId?: string, name?: string, creditValue?: number): Promise<Course> {
        const session = graphDriver.session();
        try {
            const encodedName = name ? encodeText(name) : undefined;
            internalId = internalId ? globalizeField(universityId, internalId) : undefined;
            const baseQuery = buildQuery('MATCH (c:Course {id: $id})-[:BELONGS_TO]->(:University {id: $universityId})', 'SET', ',', [
                {entry: 'c.name = $name, c.encoding = $encoding', value: name},
                {entry: 'c.internalId = $internalId', value: internalId},
                {entry: 'c.creditValue = $creditValue', value: creditValue}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN c`,
                {universityId, id, internalId, name: encodedName?.cleanText, encoding: encodedName?.encoding, creditValue}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToCourse(node);
        } catch (err) {
            throw parseErrors(err, '[CourseDao:modify]', ERRORS.BAD_REQUEST.COURSE_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async delete(id: string, universityId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (c:Course {id: $id})-[:BELONGS_TO]->(:University {id: $universityId}) ' +
                'OPTIONAL MATCH (cc:CourseClass)-[:OF]->(c)' +
                'OPTIONAL MATCH (l:Lecture)-[:OF]->(cc)' +
                'DETACH DELETE l, cc, c',
                {id, universityId}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[CourseDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
    }

    async findById(id: string, universityId?: string): Promise<Course | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (c:Course {id: $id})', 'WHERE', 'AND', [
                {entry: '(c)-[:BELONGS_TO]->(:University {id: $universityId})', value: universityId},
            ]);
            const result = await session.run(
                `${baseQuery} RETURN c`,
                {id, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToCourse(node);
        } catch (err) {
            logErrors(err, '[CourseDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, programId?: string, optional?: boolean, universityId?: string): Promise<PaginatedCollection<Course>> {
        // Initialize useful variables
        const collection: DatabaseCourse[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (c:Course)', 'WHERE', 'AND', [
                {entry: '(c.name CONTAINS $textSearch OR c.internalId =~ $globalRegex)', value: textSearch},
                {entry: '(c)-[:BELONGS_TO]->(:University {id: $univesityId})', value: universityId},
                {entry: `(c)-[:IN${optional !== undefined ? ` {optional: ${optional}}` : ''}]->(:Program {id: $programId})`, value: programId}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(c) as count`,
                {textSearch, globalRegex, universityId, programId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN c ORDER BY c.name SKIP $skip LIMIT $limit`,
                    {textSearch, globalRegex, universityId, programId, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToCourse(node));
                }
            }
        } catch (err) {
            logErrors(err, '[CourseDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    async findPaginatedRequiredCourses(page: number, limit: number, id: string, textSearch?: string, programId?: string, universityId?: string): Promise<PaginatedCollection<Course>> {
        // Initialize useful variables
        const collection: DatabaseCourse[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (c:Course {id: $id})-[r:REQUIRES]->(rc:Course)', 'WHERE', 'AND', [
                {entry: '(rc.name CONTAINS $textSearch OR rc.internalId =~ $globalRegex)', value: textSearch},
                {entry: '(c)-[:BELONGS_TO]->(:University {id: $univesityId})', value: universityId},
                {entry: `r.programId = $programId`, value: programId}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(rc) as count`,
                {id, textSearch, globalRegex, universityId, programId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN rc ORDER BY rc.name SKIP $skip LIMIT $limit`,
                    {id, textSearch, globalRegex, universityId, programId, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToCourse(node));
                }
            }
        } catch (err) {
            logErrors(err, '[CourseDao:findPaginatedRequiredCourses]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    async findPaginatedRemainingCourses(page: number, limit: number, studentId: string, programId: string, universityId: string, textSearch?: string, optional?: boolean): Promise<PaginatedCollection<Course>> {
        // Initialize useful variables
        const collection: DatabaseCourse[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (c:Course)-[r:IN]->(:Program {id: $programId})-[:BELONGS_TO]->(:University {id: $universityId})', 'WHERE', 'AND', [
                {entry: 'r.optional = $optional', value: optional},
                {entry: '(c.name CONTAINS $textSearch OR c.internalId =~ $globalRegex)', value: textSearch},
                {entry: 'NOT EXISTS((:Student {id: $studentId})-[:COMPLETED]->(c))', value: studentId}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(c) as count`,
                {studentId, programId, universityId, textSearch, globalRegex, optional}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN c ORDER BY c.name SKIP $skip LIMIT $limit`,
                    {studentId, programId, universityId, textSearch, globalRegex, optional, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToCourse(node));
                }
            }
        } catch (err) {
            logErrors(err, '[CourseDao:findPaginatedRemainingCourses]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    async findPaginatedCompletedCourses(page: number, limit: number, studentId: string, textSearch?: string, optional?: boolean, programId?: string, universityId?: string): Promise<PaginatedCollection<Course>> {
        // Initialize useful variables
        const collection: DatabaseCourse[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (:Student {id: $studentId})-[:COMPLETED]->(c:Course)', 'WHERE', 'AND', [
                {entry: `(c)-[:IN${optional !== undefined ? ` {optional: ${optional}}` : ''}]->(:Program {id: $programId})`, value: programId},
                {entry: '(c.name CONTAINS $textSearch OR c.internalId =~ $globalRegex)', value: textSearch},
                {entry: '(c)-[:BELONGS_TO]->(:University {id: $universityId})', value: universityId}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(c) as count`,
                {studentId, textSearch, globalRegex, programId, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN c ORDER BY c.name SKIP $skip LIMIT $limit`,
                    {studentId, textSearch, globalRegex, programId, universityId, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToCourse(node));
                }
            }
        } catch (err) {
            logErrors(err, '[CourseDao:findPaginatedCompletedCourses]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    async getCreditRequirements(id: string, universityId: string): Promise<IProgramRequiredCredits[]> {
        // Initialize useful variables
        const collection: IProgramRequiredCredits[] = [];

        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (c: Course {id: $id})-[r: IN]->(: Program)', 'WHERE', 'AND', [
                {entry: '(c)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN r`,
                {id, universityId}
            );
            const nodes = getNodes(result);
            for (const node of nodes) {
                collection.push(this.nodeToCreditRequirement(node));
            }
        } catch (err) {
            logErrors(err, '[CourseDao:getCreditRequirements]');
        } finally {
            await session.close();
        }

        return collection;
    }

    async findCreditRequirement(id: string, programId: string, universityId: string): Promise<IProgramRequiredCredits | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (c: Course {id: $id})-[r: IN]->(p: Program {id:$programId})', 'WHERE', 'AND', [
                {entry: '(c)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN r`,
                {id, programId, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToCreditRequirement(node);
        } catch (err) {
            logErrors(err, '[CourseDao:getCreditRequirement]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    private nodeToCourse(node: any): DatabaseCourse {
        return new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.creditValue);
    }

    private nodeToCreditRequirement(node: any): IProgramRequiredCredits {
        return {
            programId: getToIdFromRelId(node.relId),
            requiredCredits: node.requiredCredits
        }
    }
}
