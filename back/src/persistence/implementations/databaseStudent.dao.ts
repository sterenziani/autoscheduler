import { ERRORS } from "../../constants/error.constants";
import GenericException from "../../exceptions/generic.exception";
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from "../../helpers/collection.helper";
import { buildQuery, getNode, getNodes, getRelId, getStats, getValue, graphDriver, logErrors, parseErrors, toGraphInt } from "../../helpers/persistence/graphPersistence.helper";
import { cleanMaybeText, decodeText, encodeText } from "../../helpers/string.helper";
import { PaginatedCollection } from "../../interfaces/paging.interface";
import { IStudentInfo } from "../../interfaces/student.interface";
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
            // Constraints
            await session.run(
                'CREATE CONSTRAINT student_id_unique_constraint IF NOT EXISTS FOR (s: Student) REQUIRE s.id IS UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT enrolled_in_unique_constraint IF NOT EXISTS FOR ()-[r:ENROLLED_IN]-() REQUIRE r.relId IS REL UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT follows_unique_constraint IF NOT EXISTS FOR ()-[r:FOLLOWS]-() REQUIRE r.relId IS REL UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT completed_unique_constraint IF NOT EXISTS FOR ()-[r:COMPLETED]-() REQUIRE r.relId IS REL UNIQUE'
            );
            // Indexes
            await session.run(
                'CREATE TEXT INDEX student_name_text_index IF NOT EXISTS FOR (s: Student) ON (s.name)'
            );
        } catch (err) {
            console.log(`[StudentDao:init] Warning: Failed to create constraints and indexes. Reason: ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(id: string, universityId: string, programId: string, name: string): Promise<Student> {
        const session = graphDriver.session();
        try {
            const encodedName = encodeText(name);
            const enrolledInRelId = getRelId(ENROLLED_IN_PREFIX, id, universityId);
            const followsRelId = getRelId(FOLLOWS_PREFIX, id, programId);
            const result = await session.run(
                'MATCH (p: Program {id: $programId})-[:BELONGS_TO]->(u: University {id: $universityId}) ' +
                'CREATE (u)<-[:ENROLLED_IN {relId: $enrolledInRelId}]-(s: Student {id: $id, name: $name, encoding: $encoding})-[:FOLLOWS {relId: $followsRelId}]->(p) RETURN s',
                {universityId, programId, id, name: encodedName.cleanText, encoding: encodedName.encoding, enrolledInRelId, followsRelId}
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
            const encodedName = name ? encodeText(name) : undefined;
            const followsRelId = programId ? getRelId(FOLLOWS_PREFIX, id, programId) : undefined;
            const result = await session.run(
                'MATCH (p)<-[f:FOLLOWS]-(s:Student {id: $id})-[:ENROLLED_IN]->(u) ' +
                (programId ? 'MATCH (np:Program {id: $programId})-[:BELONGS_TO]->(u) ' : '') +
                (name ? 'SET s.name = $name, s.encoding = $encoding ' : '') +
                (programId ? 'DELETE f CREATE (s)-[:FOLLOWS {relId: $followsRelId}]->(np) ' : '') +
                'RETURN s',
                {id, programId, name: encodedName?.cleanText, encoding: encodedName?.encoding, followsRelId}
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
        const session = graphDriver.session();
        try {
            const result = await session.run(
                `MATCH (s:Student {id: $id}) DETACH DELETE s`,
                {id}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[StudentDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
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

        const session = graphDriver.session();
        try {
            textSearch = cleanMaybeText(textSearch);
            // Build query
            const baseQuery = buildQuery('MATCH (s:Student)-[:ENROLLED_IN]->(u)', 'WHERE', 'AND', [
                {entry: 's.name CONTAINS $textSearch', value: textSearch},
                {entry: 'u.id = $universityId', value: universityId}
            ]);
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(s) as count`,
                {textSearch, universityId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);

            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN s ORDER BY s.name SKIP $skip LIMIT $limit`,
                    {textSearch, universityId, skip: toGraphInt(getSkipFromPageLimit(page, limit)), limit: toGraphInt(limit)}
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

    async getStudentInfo(id: string): Promise<IStudentInfo> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                `MATCH (p)<-[:FOLLOWS]-(s:Student {id: $id})-[:ENROLLED_IN]->(u) RETURN p.id as programId, u.id as universityId`,
                {id}
            );
            const programId = getValue<string | undefined>(result, 'programId');
            const universityId = getValue<string | undefined>(result, 'universityId');
            if (!programId || !universityId) throw new GenericException(this.notFoundError);
            return {
                studentId: id,
                universityId: universityId,
                programId: programId
            };
        } catch (err) {
            throw parseErrors(err, '[StudentDao:getStudentInfo]');
        } finally {
            await session.close();
        }
    }

    async addCompletedCourse(id: string, universityId: string, courseId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(COMPLETED_PREFIX, id, courseId);
            const result = await session.run(
                'MATCH (c:Course {id: $courseId})-[:BELONGS_TO]->(:University {id: $universityId})<-[:ENROLLED_IN]-(s:Student {id: $id}) ' +
                'CREATE (s)-[:COMPLETED {relId: $relId}]->(c)',
                {id, universityId, courseId, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or student was not found
        } catch (err) {
            throw parseErrors(err, '[StudentDao:addCompletedCourse]', ERRORS.BAD_REQUEST.COURSE_ALREADY_COMPLETED_BY_STUDENT);
        } finally {
            await session.close();
        }
    }

    async removeCompletedCourse(id: string, universityId: string, courseId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const relId = getRelId(COMPLETED_PREFIX, id, courseId);
            const result = await session.run(
                'MATCH ()-[r:COMPLETED {relId: $relId]->(c)-[:BELONGS_TO]->(:University {id: $universityId}) ' +
                'DELETE r',
                {universityId, relId}
            );
            const stats = getStats(result);
            if (stats.relationshipsDeleted === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or student or relationship was not found
        } catch (err) {
            throw parseErrors(err, '[StudentDao:removeCompletedCourse]');
        } finally {
            await session.close();
        }
    }

    async bulkAddCompletedCourses(id: string, universityId: string, courseIds: string[]): Promise<void> {
        const parsedCourses = this.parseCourses(courseIds, id);
        if (parsedCourses.length === 0) return;

        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (s:Student {id: $id})-[:ENROLLED_IN]->(u:University {id: $universityId}) ' +
                'UNWIND $parsedCourses as course ' +
                'MATCH (c:Course {id: course.id})-[:BELONGS_TO]->(u) ' +
                'CREATE (s)-[:COMPLETED {relId: course.relId}]->(c)',
                {id, universityId, parsedCourses}
            );
            const stats = getStats(result);
            if (stats.relationshipsCreated === 0) throw new GenericException(ERRORS.NOT_FOUND.COURSE);  // TODO: We don't know if course or students was not found
        } catch (err) {
            throw parseErrors(err, '[StudentDao:bulkAddCompletedCourses]', ERRORS.BAD_REQUEST.COURSE_ALREADY_COMPLETED_BY_STUDENT);
        } finally {
            await session.close();
        }
    }

    async bulkReplaceCompletedCourses(id: string, universityId: string, courseIds: string[]): Promise<void> {
        const parsedCourses = this.parseCourses(courseIds, id);

        const session = graphDriver.session();
        const transaction = session.beginTransaction();
        try {
            // We delete first since we are going to replace all the existing courses with the new courses
            const deleteResult = await transaction.run(
                'MATCH (s:Student {id: $id})-[:ENROLLED_IN]->(u:University {id: $universityId}) OPTIONAL MATCH (s)-[r:COMPLETED]->() DELETE r RETURN s.id as id',
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
                'MATCH (s:Student {id: $id})-[:ENROLLED_IN]->(u:University {id: $universityId}) ' +
                'UNWIND $parsedCourses as course ' +
                'MATCH (c:Course {id: course.id})-[:BELONGS_TO]->(u) ' +
                'CREATE (s)-[:COMPLETED {relId: course.relId}]->(c)',
                {id, universityId, parsedCourses}
            );
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw parseErrors(err, '[StudentDao:bulkReplaceCompletedCourses]', ERRORS.BAD_REQUEST.COURSE_ALREADY_COMPLETED_BY_STUDENT);
        } finally {
            await transaction.close();
            await session.close();
        }
    }

    private nodeToStudent(node: any): DatabaseStudent {
        return new DatabaseStudent(node.id, decodeText(node.name, node.encoding));
    }

    private parseCourses(courseIds: string[], studentId: string) {
        const parsed: {id: string, relId: string}[] = [];
        for (const id of courseIds) {
            parsed.push({
                id,
                relId: getRelId(COMPLETED_PREFIX, studentId, id)
            });
        }
        return parsed;
    }
}