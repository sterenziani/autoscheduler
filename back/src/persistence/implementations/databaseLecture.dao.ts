import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import TimeRange from '../../helpers/classes/timeRange.class';
import { getNode, getRelId, graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import Lecture from '../../models/abstract/lecture.model';
import DatabaseLecture from '../../models/implementations/databaseLecture.model';
import LectureDao from '../abstract/lecture.dao';
import {v4 as uuidv4} from 'uuid';

const OF_PREFIX = 'LC';
const TAKES_PLACE_IN_PREFIX = 'LB';

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

    async create(universityId: string, courseClassId: string, timeRange: TimeRange, buildingId: string): Promise<Lecture> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const ofRelId = getRelId(OF_PREFIX, id, courseClassId);
            const takesPlaceInRelId = getRelId(TAKES_PLACE_IN_PREFIX, id, buildingId);
            const result = await session.run(
                'MATCH (cc: CourseClass {id: $courseClassId})-[:OF]->(:Course)-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(b: Building {id: $buildingId}) ' +
                'CREATE (b)<-[:TAKES_PLACE_IN {relId: $takesPlaceInRelId}]-(l: Lecture {id: $id, time: $time})-[:OF {relId: $ofRelId}]->(cc) RETURN l',
                {universityId, courseClassId, buildingId, id, time: timeRange.toString(), ofRelId, takesPlaceInRelId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);     // TODO: Better error, we dont know if building or course class or uni was not found
            return this.nodeToLecture(node);
        } catch (err) {
            throw parseErrors(err, '[LectureDao:create]');
        } finally {
            await session.close();
        }
    }

    private nodeToLecture(node: any): DatabaseLecture {
        return new DatabaseLecture(node.id, TimeRange.fromString(node.time));
    }
}
