import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRegex, getRelId, getStats, getValue, globalizeField, graphDriver, logErrors, parseErrors, toGraphDate, parseGraphDate, toGraphInt } from '../../helpers/persistence/graphPersistence.helper';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import { decodeText, encodeText } from '../../helpers/string.helper';
import Term from '../../models/abstract/term.model';
import DatabaseTerm from '../../models/implementations/databaseTerm.model';
import TermDao from '../abstract/term.dao';
import {v4 as uuidv4} from 'uuid';

const BELONGS_TO_PREFIX = 'T-U';

export default class DatabaseTermDao extends TermDao {
    private static instance: TermDao;

    static getInstance = () => {
        if (!DatabaseTermDao.instance) {
            DatabaseTermDao.instance = new DatabaseTermDao();
        }
        return DatabaseTermDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            // Constraints
            await session.run(
                'CREATE CONSTRAINT term_id_unique_constraint IF NOT EXISTS FOR (t: Term) REQUIRE t.id IS UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT term_internal_id_unique_constraint IF NOT EXISTS FOR (t: Term) REQUIRE t.internalId IS UNIQUE'
            );
            // Indexes
            await session.run(
                'CREATE TEXT INDEX term_name_text_index IF NOT EXISTS FOR (t: Term) ON (t.name)'
            );
        } catch (err) {
            console.log(`[TermDao:init] Warning: Failed to create constraints and indexes. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, internalId: string, name: string, startDate: Date, published: boolean): Promise<Term> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const encodedName = encodeText(name);
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (t: Term {id: $id, internalId: $internalId, name: $name, encoding: $encoding, startDate: $startDate, published: $published})-[:BELONGS_TO {relId: $relId}]->(u) RETURN t',
                {universityId, id, internalId, name: encodedName.cleanText, encoding: encodedName.encoding, startDate: toGraphDate(startDate), published, relId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToTerm(node);
        } catch (err) {
            throw parseErrors(err, '[TermDao:create]', ERRORS.BAD_REQUEST.TERM_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, universityId: string, internalId?: string, name?: string, startDate?: Date, published?: boolean): Promise<Term> {
        const session = graphDriver.session();
        try {
            const encodedName = name ? encodeText(name) : undefined;
            internalId = internalId ? globalizeField(universityId, internalId) : undefined;
            const baseQuery = buildQuery('MATCH (t: Term {id: $id})-[:BELONGS_TO]->(u: University {id: $universityId})', 'SET', ',', [
                {entry: 't.internalId = $internalId', value: internalId},
                {entry: 'p.name = $name, p.encoding = $encoding', value: name},
                {entry: 't.startDate = $startDate', value: startDate},
                {entry: 't.published = $published', value: published}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN t`,
                {universityId, id, internalId, name: encodedName?.cleanText, encoding: encodedName?.encoding, startDate, published}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToTerm(node);
        } catch (err) {
            throw parseErrors(err, '[TermDao:modify]', ERRORS.BAD_REQUEST.TERM_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async delete(id: string, universityId: string): Promise<void>{
        const session = graphDriver.session();
        try {
            const result = await session.run(
                `MATCH (l: Lecture)-[:OF]->(cc:CourseClass)-[:HAPPENS_IN]->(t:Term {id: $id})-[:BELONGS_TO]->(: University {id: $universityId}) DETACH DELETE l, cc, t`,
                {id, universityId}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[TermDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
    }

    async findById(id: string, universityId?: string): Promise<Term | undefined>{
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (t: Term {id: $id})', 'WHERE', 'AND', [
                {entry: '(t)-[:BELONGS_TO]->(: University {id: $universityId})', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN t`,
                {id, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToTerm(node);
        } catch (err) {
            logErrors(err, '[TermDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, from?: Date, to?: Date, published?: boolean, universityId?: string): Promise<PaginatedCollection<Term>>{
        // Initialize useful variables
        const collection: DatabaseTerm[] = [];
        let lastPage = 1;
        const regex = getRegex(textSearch);
        const globalRegex = getGlobalRegex(textSearch);

        const session = graphDriver.session();
        try {
            // Build query
            const baseQuery = buildQuery('MATCH (u: University)<-[:BELONGS_TO]-(t: Term)', 'WHERE', 'AND', [
                {entry: '(t.name =~ $regex OR t.internalId =~ $globalRegex)', value: textSearch},
                {entry: 't.startDate >= $from', value: from},
                {entry: 't.startDate <= $to', value: to},
                {entry: 't.published = $published', value: published},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(t) as count`,
                {regex, globalRegex, universityId, from, to, published}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);

            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN t ORDER BY t.name SKIP $skip LIMIT $limit`,
                    {regex, globalRegex, universityId, skip: toGraphInt(getSkipFromPageLimit(page, limit)), limit: toGraphInt(limit)}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToTerm(node));
                }
            }
        } catch (err) {
            logErrors(err, '[TermDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    private nodeToTerm(node: any): DatabaseTerm {
        return new DatabaseTerm(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.published, parseGraphDate(node.startDate));
    }
}
