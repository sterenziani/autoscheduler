import University from '../../models/abstract/university.model';
import DatabaseUniversity from '../../models/implementations/databaseUniversity.model';
import UniversityDao from '../abstract/university.dao';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, getNode, getNodes, getRegex, getValue, graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';

export default class DatabaseUniversityDao extends UniversityDao {
    private static instance: UniversityDao;

    static getInstance = () => {
        if (!DatabaseUniversityDao.instance) {
            DatabaseUniversityDao.instance = new DatabaseUniversityDao();
        }
        return DatabaseUniversityDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT university_id_unique_constraint IF NOT EXISTS FOR (u: University) REQUIRE u.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT university_name_unique_constraint IF NOT EXISTS FOR (u: University) REQUIRE u.name IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT belongs_to_unique_constraint IF NOT EXISTS FOR ()-[r:BELONGS_TO]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[UniversityDao:init] Warning: Failed to set constraints. Reason: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
    
    async create(id: string, name: string, verified: boolean): Promise<University> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'CREATE (u: University {id: $id, name: $name, verified: $verified}) RETURN u',
                {id, name, verified}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.EMPTY_NODE);
            return this.nodeToUniversity(node);
        } catch (err) {
            throw parseErrors(err, '[UniversityDao:create]', ERRORS.BAD_REQUEST.UNIVERSITY_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, name?: string, verified?: boolean): Promise<University> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (u: University {id: $id})', 'SET', ',', [
                {entry: 'u.name = $name', value: name},
                {entry: 'u.verified = $verified', value: verified}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN u`,
                {id, name, verified}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToUniversity(node);
        } catch (err) {
            throw parseErrors(err, '[UniversityDao:modify]', ERRORS.BAD_REQUEST.UNIVERSITY_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    // We never use this
    async delete(id: string): Promise<void> {
        throw new Error('Not implemented');
    }

    async findById(id: string): Promise<University | undefined> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (u: University {id: $id}) RETURN u',
                {id}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToUniversity(node);
        } catch (err) {
            logErrors(err, '[UniversityDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, verified?: boolean): Promise<PaginatedCollection<University>> {
        // Initialize useful variables
        const collection: University[] = [];
        let lastPage = 1;
        const regex = getRegex(textSearch);

        const session = graphDriver.session();
        try {
            // Build query
            const baseQuery = buildQuery('MATCH (u: University)', 'WHERE', 'AND', [
                {entry: 'u.name =~ $regex', value: textSearch},
                {entry: 'u.verified = $verified', value: verified}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(u) as count`,
                {regex, verified}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN u ORDER BY u.name SKIP $skip LIMIT $limit`,
                    {regex, verified, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToUniversity(node));
                }
            }
        } catch (err) {
            logErrors(err, '[UniversityDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    private nodeToUniversity(node: any): DatabaseUniversity {
        return new DatabaseUniversity(node.id, node.name, node.verified)
    }
}
