import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getSkipFromPageLimit, getLastPageFromCount, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
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
            const promises: Promise<any>[] = [];
            // Constraints
            promises.push(session.run(
                'CREATE CONSTRAINT course_class_id_unique_constraint IF NOT EXISTS FOR (cc: CourseClass) REQUIRE cc.id IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT course_class_internal_id_unique_constraint IF NOT EXISTS FOR (cc: CourseClass) REQUIRE cc.internalId IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT happens_in_unique_constraint IF NOT EXISTS FOR ()-[r:HAPPENS_IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            // Indexes
            promises.push(session.run(
                'CREATE TEXT INDEX course_class_name_text_index IF NOT EXISTS FOR (cc: CourseClass) ON (cc.name)'
            ));
            await Promise.allSettled(promises);
        } catch (err) {
            console.log(`[CourseClassDao] Warning: Failed to create constraints and indexes. Reason ${JSON.stringify(err)}`);
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
            // TODO: InternalId should only be exclusive within the course and term, not university itself
            internalId = globalizeField(universityId, internalId);
            const ofRelId = getRelId(OF_PREFIX, id, courseId);
            const happensInRelId = getRelId(HAPPENS_IN_PREFIX, id, termId);
            const result = await session.run(
                'MATCH (t: Term {id: $termId})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'CREATE (t)<-[:HAPPENS_IN {relId: $happensInRelId}]-(cc: CourseClass {id: $id, internalId: $internalId, name: $name, encoding: $encoding})-[:OF {relId: $ofRelId}]->(c) RETURN cc',
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

    async modify(id: string, universityId: string, courseId?: string | undefined, termId?: string | undefined, internalId?: string | undefined, name?: string | undefined): Promise<CourseClass> {
        const session = graphDriver.session();
        try {
            const encodedName = name ? encodeText(name) : undefined;
            // TODO: InternalId should only be exclusive within the course and term, not university itself
            internalId = internalId ? globalizeField(universityId, internalId) : undefined;
            const ofRelId = (courseId !== undefined) ? getRelId(OF_PREFIX, id, courseId) : undefined;
            const happensInRelId = (termId !== undefined) ? getRelId(HAPPENS_IN_PREFIX, id, termId) : undefined;
            
            // If termId is defined, we add specific parts in the middle of the query to replace edge
            let newTermMatch = ''
            let newTermRelationshipReplace = ''
            if(termId !== undefined){
                newTermMatch = ', (t: Term {id: $termId})-[:BELONGS_TO]->(u)'
                newTermRelationshipReplace = 'DELETE ohr CREATE (cc) -[:HAPPENS_IN {relId: $happensInRelId}]-> (t)'
            }

            const baseQuery = buildQuery(`MATCH (u: University {id: $universityId}), (u) <-[:BELONGS_TO]- (: Term) <-[ohr:HAPPENS_IN]- (cc:CourseClass {id: $id}) -[:OF {relId: $ofRelId}]->(: Course {id: $courseId}) -[:BELONGS_TO]-> (u) ${newTermMatch}`, 'SET', ',', [
                {entry: 'cc.name = $name, c.encoding = $encoding', value: name},
                {entry: 'cc.internalId = $internalId', value: internalId}
            ]);

            const result = await session.run(
                `${baseQuery} ${newTermRelationshipReplace} RETURN cc`,
                {universityId, courseId, termId, id, internalId, name: encodedName?.cleanText, encoding: encodedName?.encoding, ofRelId, happensInRelId}
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

    async delete(id: string, universityId: string, courseId?: string | undefined): Promise<void> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (cc:CourseClass {id: $id}) -[:OF]-> (c: Course) -[:BELONGS_TO]-> (u: University {id: $universityId})', 'WHERE', 'AND', [
                {entry: 'c.id = $courseId', value: courseId},
            ]);
            const result = await session.run(
                `${baseQuery} DETACH DELETE cc`,
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

    async findById(id: string, universityId?: string | undefined, courseId?: string | undefined): Promise<CourseClass | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (cc:CourseClass {id: $id}) -[:OF]->(c: Course) -[:BELONGS_TO]-> (u: University)', 'WHERE', 'AND', [
                {entry: 'u.id = $universityId', value: universityId},
                {entry: 'c.id = $courseId', value: courseId},
            ]);
            const result = await session.run(
                `${baseQuery} RETURN cc`,
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

    async findPaginated(page: number, limit: number, textSearch?: string | undefined, courseId?: string | undefined, termId?: string | undefined, universityId?: string | undefined): Promise<PaginatedCollection<CourseClass>> {
        // Initialize useful variables
        const collection: DatabaseCourseClass[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            const globalRegex = getGlobalRegex(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (cc:CourseClass) -[:OF]-> (c: Course)', 'WHERE', 'AND', [
                {entry: '(cc.name CONTAINS $textSearch OR c.internalId =~ $globalRegex)', value: textSearch},
                {entry: 'c.id = $courseId', value: courseId},
                {entry: '(cc)-[:HAPPENS_IN]->(t: Term {id: $termId})', value: termId},
                {entry: '(c)-[:BELONGS_TO]->(:University {id: $univesityId})', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(cc) as count`,
                {textSearch, globalRegex, courseId, termId, universityId, skip: getSkipFromPageLimit(page, limit), limit}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);

            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN cc ORDER BY cc.name SKIP $skip LIMIT $limit`,
                    {universityId, skip: getSkipFromPageLimit(page, limit), limit}
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
        return new DatabaseCourseClass(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding));
    }
}
