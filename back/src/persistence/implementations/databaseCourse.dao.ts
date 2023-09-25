import { graphDriver } from '../../helpers/persistence/graphPersistence.helper';
import CourseDao from '../abstract/course.dao';

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
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT course_id_unique_constraint IF NOT EXISTS FOR (c: Course) REQUIRE c.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT course_internal_id_unique_constraint IF NOT EXISTS FOR (c: Course) REQUIRE c.internalId IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT requires_unique_constraint IF NOT EXISTS FOR ()-[r:REQUIRES]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT in_unique_constraint IF NOT EXISTS FOR ()-[r:IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT of_unique_constraint IF NOT EXISTS FOR ()-[r:OF]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[CourseDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
}
