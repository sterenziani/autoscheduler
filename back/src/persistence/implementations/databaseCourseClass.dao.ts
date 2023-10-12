import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getSkipFromPageLimit, getLastPageFromCount, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors, toGraphInt } from '../../helpers/persistence/graphPersistence.helper';
import { cleanMaybeText, decodeText, encodeText } from '../../helpers/string.helper';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import CourseClass from '../../models/abstract/courseClass.model';
import DatabaseCourseClass from '../../models/implementations/databaseCourseClass.model';
import CourseClassDao from '../abstract/courseClass.dao';
import {v4 as uuidv4} from 'uuid';

const OF_PREFIX = 'CC-C';
const HAPPENS_IN_PREFIX = 'CC-T';

export default class DatabaseCourseClassDao extends CourseClassDao {
    private static instance: CourseClassDao;

    static getInstance = () => {
        if (!DatabaseCourseClassDao.instance) {
            DatabaseCourseClassDao.instance = new DatabaseCourseClassDao();
        }
        return DatabaseCourseClassDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            // Constraints
            await session.run(
                'CREATE CONSTRAINT course_class_id_unique_constraint IF NOT EXISTS FOR (cc: CourseClass) REQUIRE cc.id IS UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT course_class_internal_id_unique_constraint IF NOT EXISTS FOR (cc: CourseClass) REQUIRE cc.internalId IS UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT happens_in_unique_constraint IF NOT EXISTS FOR ()-[r:HAPPENS_IN]-() REQUIRE r.relId IS REL UNIQUE'
            );
            // Indexes
            await session.run(
                'CREATE TEXT INDEX course_class_name_text_index IF NOT EXISTS FOR (cc: CourseClass) ON (cc.name)'
            );
        } catch (err) {
            console.log(`[CourseClassDao:init] Warning: Failed to create constraints and indexes. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, courseId: string, termId: string, internalId: string, name: string): Promise<CourseClass> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const encodedName = encodeText(name);
            internalId = globalizeField(`${universityId}-${courseId}-${termId}`, internalId);
            const ofRelId = getRelId(OF_PREFIX, id, courseId);
            const happensInRelId = getRelId(HAPPENS_IN_PREFIX, id, termId);
            const result = await session.run(
                'MATCH (t: Term {id: $termId})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'CREATE (t)<-[:HAPPENS_IN {relId: $happensInRelId}]-(cc: CourseClass {id: $id, internalId: $internalId, name: $name, encoding: $encoding})-[:OF {relId: $ofRelId}]->(c) ' +
                'RETURN {properties:cc{.*, courseId:c.id, termId:t.id}}',
                {universityId, courseId, termId, id, internalId, name: encodedName.cleanText, encoding: encodedName.encoding, ofRelId, happensInRelId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);     // TODO: Better error, we dont know if term or course or uni was not found
            return this.nodeToCourseClass(node);
        } catch (err) {
            throw parseErrors(err, '[CourseClassDao:create]', ERRORS.BAD_REQUEST.COURSE_CLASS_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, universityId: string, courseId?: string, termId?: string, internalId?: string, name?: string): Promise<CourseClass> {
        const session = graphDriver.session();
        try {
            const encodedName = name ? encodeText(name) : undefined;
            internalId = internalId ? globalizeField(`${universityId}-${courseId}-${termId}`, internalId) : undefined;
            const happensInRelId = termId ? getRelId(HAPPENS_IN_PREFIX, id, termId) : undefined;

            let query = buildQuery('MATCH (ot:Term)<-[r:HAPPENS_IN]-(cc:CourseClass {id: $id})-[:OF]->(c:Course)-[:BELONGS_TO]->(u:University {id: $universityId})', 'WHERE', 'AND', [
                {entry: 'c.id = $courseId', value: courseId}
            ]);

            query += termId ? ' MATCH (t:Term {id: $termId})-[:BELONGS_TO]->(u)' : '';

            query = buildQuery(query, 'SET', ',', [
                {entry: 'cc.name = $name, cc.encoding = $encoding', value: name},
                {entry: 'cc.internalId = $internalId', value: internalId}
            ]);

            query += termId ? ' DELETE r CREATE (cc)-[:HAPPENS_IN {relId: $happensInRelId}]->(t)' : '';

            const result = await session.run(
                `${query} RETURN {properties:cc{.*, courseId:c.id, termId:${termId ? 't.id' : 'ot.id'}}}`,
                {universityId, courseId, termId, id, internalId, name: encodedName?.cleanText, encoding: encodedName?.encoding, happensInRelId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToCourseClass(node);
        } catch (err) {
            throw parseErrors(err, '[CourseClassDao:modify]', ERRORS.BAD_REQUEST.COURSE_CLASS_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async delete(id: string, universityId: string, courseId?: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (cc:CourseClass {id: $id})-[:OF]->(c:Course)-[:BELONGS_TO]->(:University {id: $universityId})', 'WHERE', 'AND', [
                {entry: 'c.id = $courseId', value: courseId},
            ]);
            const result = await session.run(
                `${baseQuery} OPTIONAL MATCH (l:Lecture)-[:OF]->(cc) DETACH DELETE l, cc`,
                {id, universityId, courseId}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[CourseClassDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
    }

    async findById(id: string, universityId?: string, courseId?: string): Promise<CourseClass | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (t:Term)<-[r:HAPPENS_IN]-(cc:CourseClass {id: $id})-[:OF]->(c: Course)-[:BELONGS_TO]->(u: University)', 'WHERE', 'AND', [
                {entry: 'u.id = $universityId', value: universityId},
                {entry: 'c.id = $courseId', value: courseId},
            ]);
            const result = await session.run(
                `${baseQuery} RETURN {properties:cc{.*, courseId:c.id, termId:t.id}}`,
                {id, universityId, courseId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToCourseClass(node);
        } catch (err) {
            logErrors(err, '[CourseCourseDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, courseId?: string, termId?: string, universityId?: string): Promise<PaginatedCollection<CourseClass>> {
        // Initialize useful variables
        const collection: DatabaseCourseClass[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery(`MATCH (t:Term)<-[r:HAPPENS_IN]-(cc:CourseClass)-[:OF]->(c: Course)`, 'WHERE', 'AND', [
                {entry: '(cc.name CONTAINS $textSearch OR cc.internalId =~ $globalRegex)', value: textSearch},
                {entry: 'c.id = $courseId', value: courseId},
                {entry: 't.id = $termId', value: termId},
                {entry: '(c)-[:BELONGS_TO]->(:University {id: $universityId})', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(cc) as count`,
                {textSearch, globalRegex, courseId, termId, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);

            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN {properties:cc{.*, courseId:c.id, termId:t.id}} ORDER BY cc.name SKIP $skip LIMIT $limit`,
                    {textSearch, globalRegex, courseId, termId, universityId, skip: toGraphInt(getSkipFromPageLimit(page, limit)), limit: toGraphInt(limit)}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToCourseClass(node));
                }
            }
        } catch (err) {
            logErrors(err, '[CourseClassDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    // Private helper methods

    private nodeToCourseClass(node: any): DatabaseCourseClass {
        return new DatabaseCourseClass(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.courseId, node.termId);
    }
}
