import { graphDriver } from '../../helpers/persistence/graphPersistence.helper';
import LectureDao from '../abstract/lecture.dao';

export default class DatabaseLectureDao extends LectureDao {
    private static instance: LectureDao;

    static getInstance = () => {
        if (!DatabaseLectureDao.instance) {
            DatabaseLectureDao.instance = new DatabaseLectureDao();
        }
        return DatabaseLectureDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT lecture_id_unique_constraint IF NOT EXISTS FOR (l: Lecture) REQUIRE l.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT takes_place_in_unique_constraint IF NOT EXISTS FOR ()-[r:TAKES_PLACE_IN]-() REQUIRE r.relId IS REL UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[LectureDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
}
