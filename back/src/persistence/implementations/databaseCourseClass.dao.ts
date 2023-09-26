import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { deglobalizeField, getNode, getRelId, globalizeField, graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
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
            internalId = globalizeField(universityId, internalId);
            const ofRelId = getRelId(OF_PREFIX, id, courseId);
            const happensInRelId = getRelId(HAPPENS_IN_PREFIX, id, termId);
            const result = await session.run(
                'MATCH (t: Term {id: $termId})-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(c: Course {id: $courseId}) ' +
                'CREATE (t)<-[:HAPPENS_IN {relId: $happensInRelId}]-(cc: CourseClass {id: $id, internalId: $internalId, name: $name})-[:OF {relId: $ofRelId}]->(c) RETURN cc',
                {universityId, courseId, termId, id, internalId, name, ofRelId, happensInRelId}
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

    private nodeToCourseClass(node: any): DatabaseCourseClass {
        return new DatabaseCourseClass(node.id, deglobalizeField(node.internalId), node.name);
    }
}
