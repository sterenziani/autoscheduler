import { graphDriver } from '../../helpers/persistence/graphPersistence.helper';
import CourseClassDao from '../abstract/courseClass.dao';

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
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT course_class_id_unique_constraint IF NOT EXISTS FOR (cc: CourseClass) REQUIRE cc.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT happens_in_unique_constraint IF NOT EXISTS FOR ()-[r:HAPPENS_IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[CourseClassDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
}
