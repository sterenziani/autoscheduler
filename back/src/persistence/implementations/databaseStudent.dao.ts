import { ERRORS } from "../../constants/error.constants";
import GenericException from "../../exceptions/generic.exception";
import { getNode, getRelId, graphDriver, parseErrors } from "../../helpers/persistence/graphPersistence.helper";
import Student from "../../models/abstract/student.model";
import DatabaseStudent from "../../models/implementations/databaseStudent.model";
import StudentDao from "../abstract/student.dao";

const FOLLOWS_PREFIX = 'SP';
const ENROLLED_IN_PREFIX = 'SU';
const COMPLETED_PREFIX = 'SC';

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
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT student_id_unique_constraint IF NOT EXISTS FOR (s: Student) REQUIRE s.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT enrolled_in_unique_constraint IF NOT EXISTS FOR ()-[r:ENROLLED_IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT follows_unique_constraint IF NOT EXISTS FOR ()-[r:FOLLOWS]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT completed_unique_constraint IF NOT EXISTS FOR ()-[r:COMPLETED]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[StudentDao:init] Warning: Failed to set constraints. Reason: ${JSON.stringify(err)}`);
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

    private nodeToStudent(node: any): DatabaseStudent {
        return new DatabaseStudent(node.id, node.name);
    }
}