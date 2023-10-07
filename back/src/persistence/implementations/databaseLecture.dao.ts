import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import TimeRange from '../../helpers/classes/timeRange.class';
import Time from '../../helpers/classes/time.class';
import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import { buildQuery, getNode, getNodes, getRelId, getStats, getValue, graphDriver, logErrors, parseErrors, toGraphInt } from '../../helpers/persistence/graphPersistence.helper';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import Lecture from '../../models/abstract/lecture.model';
import DatabaseLecture from '../../models/implementations/databaseLecture.model';
import LectureDao from '../abstract/lecture.dao';
import {v4 as uuidv4} from 'uuid';

const OF_PREFIX = 'L-CC';
const TAKES_PLACE_IN_PREFIX = 'L-B';

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
            await session.run(
                'CREATE CONSTRAINT lecture_id_unique_constraint IF NOT EXISTS FOR (l: Lecture) REQUIRE l.id IS UNIQUE'
            );
            await session.run(
                'CREATE CONSTRAINT takes_place_in_unique_constraint IF NOT EXISTS FOR ()-[r:TAKES_PLACE_IN]-() REQUIRE r.relId IS REL UNIQUE'
            );
        } catch (err) {
            console.log(`[LectureDao:init] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
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
            const dayOfWeek = timeRange ? timeRange.dayOfWeek : undefined;
            const startTime = timeRange ? timeRange.startTime.toString() : undefined;
            const endTime = timeRange ? timeRange.endTime.toString() : undefined;

            const result = await session.run(
                'MATCH (cc: CourseClass {id: $courseClassId})-[:OF]->(:Course)-[:BELONGS_TO]->(u: University {id: $universityId})<-[:BELONGS_TO]-(b: Building {id: $buildingId}) ' +
                'CREATE (b)<-[:TAKES_PLACE_IN {relId: $takesPlaceInRelId}]-(l: Lecture {id: $id, dayOfWeek: $dayOfWeek, startTime: time($startTime), endTime: time($endTime)})-[:OF {relId: $ofRelId}]->(cc) RETURN l',
                {universityId, courseClassId, buildingId, id, dayOfWeek, startTime, endTime, ofRelId, takesPlaceInRelId}
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

    async modify(id: string, universityId: string, courseClassId?: string, timeRange?: TimeRange, buildingId?: string): Promise<Lecture>{
        const session = graphDriver.session();
        try {
            const takesPlaceInRelId = buildingId ? getRelId(TAKES_PLACE_IN_PREFIX, id, buildingId) : undefined;
            const dayOfWeek = timeRange ? timeRange.dayOfWeek : undefined;
            const startTime = timeRange ? timeRange.startTime.toString() : undefined;
            const endTime = timeRange ? timeRange.endTime.toString() : undefined;

            const result = await session.run(
                'MATCH (u:University {id: $universityId})<-[:BELONGS_TO]-(:Building)<-[r:TAKES_PLACE_IN]-(l:Lecture {id: $id}) ' +
                (courseClassId ? 'WHERE EXISTS((l)-[:OF]->(:CourseClass {id: $courseClassId})) ' : '') +
                (buildingId ? 'MATCH (b:Building {id: $buildingId})-[:BELONGS_TO]->(u) ' : '') +
                (timeRange ? 'SET l.dayOfWeek = $dayOfWeek, l.startTime = time($startTime), l.endTime = time($endTime) ' : '') +
                (buildingId ? 'DELETE r CREATE (l)-[:TAKES_PLACE_IN {relId: $takesPlaceInRelId}]->(b) ' : '') +
                'RETURN l',
                {universityId, id, dayOfWeek, startTime, endTime, courseClassId, buildingId, takesPlaceInRelId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(this.notFoundError);
            return this.nodeToLecture(node);
        } catch (err) {
            throw parseErrors(err, '[LectureDao:modify]', ERRORS.NOT_FOUND.UNIVERSITY); // TODO: Better error, we dont know if building or course class or uni was not found
        } finally {
            await session.close();
        }
    }

    async delete(id: string, universityId: string, courseClassId?: string): Promise<void>{
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (l: Lecture {id: $id})-[:OF]->(cc:CourseClass)-[:OF]->(:Course)-[:BELONGS_TO]->(:University {id: $universityId})', 'WHERE', 'AND', [
                {entry: 'cc.id = $courseClassId', value: courseClassId}
            ]);
            const result = await session.run(
                `${baseQuery} DETACH DELETE l`,
                {id, courseClassId, universityId}
            );
            const stats = getStats(result);
            if (stats.nodesDeleted === 0) throw new GenericException(this.notFoundError);
        } catch (err) {
            throw parseErrors(err, '[LectureDao:delete]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
    }

    async findById(id: string, universityId?: string, courseClassId?: string): Promise<Lecture | undefined>{
        const session = graphDriver.session();
        try {
            const baseQuery = buildQuery('MATCH (l: Lecture {id: $id})-[:OF]->(cc:CourseClass)-[:OF]->(:Course)-[:BELONGS_TO]->(u:University)', 'WHERE', 'AND', [
                {entry: 'cc.id = $courseClassId', value: courseClassId},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            const result = await session.run(
                `${baseQuery} RETURN l`,
                {id, universityId}
            );
            const node = getNode(result);
            if (!node) return undefined;
            return this.nodeToLecture(node);
        } catch (err) {
            logErrors(err, '[LectureDao:findById]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    async findPaginated(page: number, limit: number, times?: TimeRange[], courseClassId?: string, buildingId?: string, universityId?: string): Promise<PaginatedCollection<Lecture>>{
        // Initialize useful variables
        const collection: DatabaseLecture[] = [];
        let lastPage = 1;

        const session = graphDriver.session();
        try {
            // Queries that check if found lecture is within range defined by times
            const timeEntries = [];
            if(times){
                 for(const t of times){
                     const dayOfWeek = t.dayOfWeek;
                     const startTime = t.startTime.toString();
                     const endTime = t.endTime.toString();
                     timeEntries.push({entry: `( l.dayOfWeek = ${dayOfWeek}   AND   time(${startTime}) <= l.startTime   AND   l.endTime <= time(${endTime}) )`, value: t});
                 }
            }

            // Build query
            let baseQuery = buildQuery('MATCH (l: Lecture)-[:OF]->(cc:CourseClass)-[:OF]->(:Course)-[:BELONGS_TO]->(u:University)', 'WHERE', 'AND', [
                {entry: '(l)-[:TAKES_PLACE_IN]->(:Building {id: $buildingId})', value: buildingId},
                {entry: 'cc.id = $courseClassId', value: courseClassId},
                {entry: 'u.id = $universityId', value: universityId},
            ]);
            baseQuery = buildQuery(`${baseQuery} AND (`, '', 'OR', [...timeEntries]) + ') '
            // Count
            const countResult = await session.run(
                `${baseQuery} RETURN count(l) as count`,
                {universityId, buildingId, courseClassId}
            );
            const count = getValue<number>(countResult, 'count');
            lastPage = getLastPageFromCount(count, limit);

            // If not past last page, we query
            if (page <= lastPage) {
                const result = await session.run(
                    `${baseQuery} RETURN l ORDER BY l.dayOfWeek, l.startTime, l.endTime SKIP $skip LIMIT $limit`,
                    {universityId, skip: toGraphInt(getSkipFromPageLimit(page, limit)), limit: toGraphInt(limit)}
                );
                const nodes = getNodes(result);
                for (const node of nodes) {
                    collection.push(this.nodeToLecture(node));
                }
            }
        } catch (err) {
            logErrors(err, '[LectureDao:findPaginated]');
        } finally {
            await session.close();
        }

        return simplePaginateCollection(collection, page, lastPage);
    }

    private nodeToLecture(node: any): DatabaseLecture {
        const startTime = Time.fromString(node.startTime);
        const endTime = Time.fromString(node.endTime);
        return new DatabaseLecture(node.id, new TimeRange(node.dayOfWeek, startTime, endTime));
    }
}
