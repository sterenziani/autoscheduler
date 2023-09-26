import { ERRORS } from "../../constants/error.constants";
import GenericException from "../../exceptions/generic.exception";
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from "../../helpers/collection.helper";
import { buildQuery, getNode, getNodes, getRegex, getRelId, getValue, graphDriver, logErrors, parseErrors } from "../../helpers/persistence/graphPersistence.helper";
import { PaginatedCollection } from "../../interfaces/paging.interface";
import Student from "../../models/abstract/student.model";
import DatabaseStudent from "../../models/implementations/databaseStudent.model";
import StudentDao from "../abstract/student.dao";

const FOLLOWS_PREFIX = 'S-P';
const ENROLLED_IN_PREFIX = 'S-U';
const COMPLETED_PREFIX = 'S-C';

export default class DatabaseStudentDao extends StudentDao {
    private static instance: StudentDao;

    static getInstance = () => {
        if (!DatabaseStudentDao.instance) {
            DatabaseStudentDao.instance = new DatabaseStudentDao();
        }
        return DatabaseStudentDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const promises: Promise<any>[] = [];
            // Constraints
            promises.push(session.run(
                'CREATE CONSTRAINT student_id_unique_constraint IF NOT EXISTS FOR (s: Student) REQUIRE s.id IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT enrolled_in_unique_constraint IF NOT EXISTS FOR ()-[r:ENROLLED_IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT follows_unique_constraint IF NOT EXISTS FOR ()-[r:FOLLOWS]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT completed_unique_constraint IF NOT EXISTS FOR ()-[r:COMPLETED]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            // Indexes
            promises.push(session.run(
                'CREATE TEXT INDEX student_name_text_index IF NOT EXISTS FOR (s: Student) ON (s.name)'
            ));
            await Promise.allSettled(promises);
        } catch (err) {
            console.log(`[StudentDao:init] Warning: Failed to create constraints and indexes. Reason: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(id: string, universityId: string, programId: string, name: string): Promise<Student> {
        const session = graphDriver.session();
        try {
            const enrolledInRelId = getRelId(ENROLLED_IN_PREFIX, id, universityId);
            const followsRelId = getRelId(FOLLOWS_PREFIX, id, programId);
            const result = await session.run(
                'MATCH (p: Program {id: $programId})-[:BELONGS_TO]->(u: University {id: $universityId}) ' +
                'CREATE (u)<-[:ENROLLED_IN {relId: $enrolledInRelId}]-(s: Student {id: $id, name: $name})-[:FOLLOWS {relId: $followsRelId}]->(p) RETURN s',
                {universityId, programId, id, name, enrolledInRelId, followsRelId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY); // TODO: Actually i can be either university or program
            return this.nodeToStudent(node);
        } catch (err) {
            throw parseErrors(err, '[StudentDao:create]', ERRORS.BAD_REQUEST.STUDENT_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    async modify(id: string, programId?: string, name?: string): Promise<Student> {
        const session = graphDriver.session();
        try {
            const followsRelId = programId ? getRelId(FOLLOWS_PREFIX, id, programId) : undefined;
            const result = await session.run(
                'MATCH (p)<-[f:FOLLOWS]-(s:Student {id: $id})-[:ENROLLED_IN]->(u) ' +
                (programId ? 'MATCH (np:Program {id: $programId})-[:BELONGS_TO]->(u) ' : '') +
                (name ? 'SET s.name = $name ' : '') +
                (programId ? 'DELETE f CREATE (s)-[:FOLLOWS {relId: $followsRelId}]->(np) ' : '') +
                'RETURN s',
                {id, programId, name, followsRelId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(programId ? ERRORS.NOT_FOUND.PROGRAM : this.notFoundError);
            return this.nodeToStudent(node);
        } catch (err) {
            throw parseErrors(err, '[StudentDao:modify]', ERRORS.BAD_REQUEST.STUDENT_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    // Never used
    async delete(id: string): Promise<void> {
        throw new Error('Not Implemented.');
    }

    async findById(id: string, universityId?: string): Promise<Student | undefined> {
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (s:Student {id: $id})-[:ENROLLED_IN]->(u)', 'WHERE', 'AND', [
                {entry: 'u.id = $universityId', value: universityId}
            ]);
            const result = await session.run(
                `${baseQuery} RETURN s`,
                {id, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToStudent(node);
        } catch (err) {
            logErrors(err, '[StudentDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, textSearch?: string, universityId?: string): Promise<PaginatedCollection<Student>> {
        // Initialize useful variables
        const collection: DatabaseStudent[] = [];
        let lastPage = 1;
        const regex = getRegex(textSearch);

        const session = graphDriver.session();
        try {
            // Build query
            const baseQuery = buildQuery('MATCH (s:Student)-[:ENROLLED_IN]->(u)', 'WHERE', 'AND', [
                {entry: 's.name =~ $regex', value: textSearch},
                {entry: 'u.id = $universityId', value: universityId}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(s) as count`,
                {regex, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);
            
            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN s ORDER BY s.name SKIP $skip LIMIT $limit`,
                    {regex, universityId, skip: getSkipFromPageLimit(page, limit), limit}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToStudent(node));
                }
            }
        } catch (err) {
            logErrors(err, '[StudentDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    private nodeToStudent(node: any): DatabaseStudent {
        return new DatabaseStudent(node.id, node.name);
    }
}