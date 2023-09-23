import University from '../../../models/abstract/university.model';
import DatabaseUniversity from '../../../models/implementations/database/databaseUniversity.model';
import UniversityDao from '../../abstract/university.dao';
import DatabaseUserDao from './databaseUser.dao';
import { PaginatedCollection } from '../../../interfaces/paging.interface';
import { cleanText } from '../../../helpers/string.helper';
import { simplePaginateCollection } from '../../../helpers/collection.helper';
import { graphDriver, parseErrors } from '../../../helpers/persistence/graphPersistence.helper';
import GenericException from '../../../exceptions/generic.exception';
import { ERRORS } from '../../../constants/error.constants';

export default class DatabaseUniversityDao extends UniversityDao {
    private static instance: UniversityDao;

    static getInstance = () => {
        if (!DatabaseUniversityDao.instance) {
            DatabaseUniversityDao.instance = new DatabaseUniversityDao();
        }
        return DatabaseUniversityDao.instance;
    };

    // Abstract Methods Implementations
    public async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT university_id_unique_constraint IF NOT EXISTS FOR (u: University) REQUIRE u.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT university_unique_name_constraint IF NOT EXISTS FOR (u: University) REQUIRE u.name IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT belongs_to_unique_constraint IF NOT EXISTS FOR ()-[r:BELONGS_TO]-() REQUIRE r.id IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[UniversityDao:init] Warning: Failed to set constraints. Reason: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
    
    public async create(userId: string, name: string, verified: boolean): Promise<University> {
        const cleanName = cleanText(name);
        const newUniversity = this.getFullUniversity(userId, cleanName, verified);
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'CREATE (u: University {id: $id, name: $name, verified: $verified}) RETURN u',
                {id: userId, name: cleanName, verified}
            );
            if (result.summary.counters.updates().nodesCreated == 0) throw new GenericException(ERRORS.BAD_REQUEST.UNIVERSITY_ALREADY_EXISTS);
        } catch (err) {
            parseErrors(err, '[UniversityDao:create]', ERRORS.BAD_REQUEST.UNIVERSITY_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
        return await this.getFullUniversity(userId, cleanName, verified);
    }

    public async findById(id: string): Promise<University | undefined> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (u: University) WHERE u.id = $id RETURN u',
                {id}
            );
            const node = result.records[0]?.get(0)?.properties;
            if (!node) return undefined;

            return await this.getFullUniversity(node.id, node.name, node.verified);
        } catch (err) {
            console.log(`[UniversityDao:findById]. Error: ${JSON.stringify(err)}`);
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async set(university: University): Promise<void> {
        university.name = cleanText(university.name);
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (u: University) WHERE u.id = $id SET u.name = $name, u.verified = $verified',
                {id: university.id, name: university.name, verified: university.verified}
            );
            if (result.summary.counters.updates().propertiesSet == 0) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        } catch (err) {
            parseErrors(err, '[UniversityDao:set]', ERRORS.BAD_REQUEST.UNIVERSITY_ALREADY_EXISTS)
        } finally {
            await session.close();
        }
    }

    public async findByName(name: string): Promise<University | undefined> {
        const cleanName = cleanText(name);
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (u: University) WHERE u.name = $name RETURN u',
                {name: cleanName}
            );
            const node = result.records[0]?.get(0)?.properties;
            if (!node) return undefined;

            return await this.getFullUniversity(node.id, node.name, node.verified)
        } catch (err) {
            console.log(`[UniversityDao:findByName]. Error: ${JSON.stringify(err)}`);
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async findByText(limit: number, offset: number, text?: string): Promise<PaginatedCollection<University>> {
        const regex = `.*${cleanText(text ?? '')}.*`;
        const universities: University[] = [];
        let totalEntries = 0;

        const session = graphDriver.session();
        try {
            // Since this is paginated, we need to count as well (So much for performance improvements by using graphs i guess)
            // Making 2 separate queries is faster than combining everything in one, cuz neo4j is neo4j
            const countResult = await session.run(
                `MATCH (u: University) WHERE u.name =~ $regex RETURN count(u) as count`,
                {regex}
            );
            totalEntries = countResult.records[0].get('count') as number;
            const result = await session.run(
                `MATCH (u: University) WHERE u.name =~ $regex RETURN u ORDER BY u.name SKIP $offset LIMIT $limit`,
                {regex, limit, offset: limit * (offset - 1)}
            );
            for (const record of result.records) {
                const node = record.get(0)?.properties;
                if (!node) continue;
                universities.push(await this.getFullUniversity(node.id, node.name, node.verified));
            }
        } catch (err) {
            console.log(`[UniversityDao:findByText]. Error: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }

        return simplePaginateCollection(universities, totalEntries, limit, offset);
    }

    private async getFullUniversity(id: string, name: string, verified: boolean): Promise<DatabaseUniversity> {
        const user = await DatabaseUserDao.getInstance().getById(id);
        return new DatabaseUniversity(id, user.email, user.password, user.locale, name, verified);
    }
}
