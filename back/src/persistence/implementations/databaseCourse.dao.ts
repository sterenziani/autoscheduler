import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { deglobalizeField, getNode, getRelId, globalizeField, graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
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

    async create(universityId: string, internalId: string, name: string): Promise<Course> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (c: Course {id: $id, internalId: $internalId, name: $name})-[:BELONGS_TO {relId: $relId}]->(u) RETURN c',
                {universityId, id, internalId, name, relId}
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

    private nodeToCourse(node: any): DatabaseCourse {
        return new DatabaseCourse(node.id, deglobalizeField(node.internalId), node.name);
    }
}
