import ScheduleDao from '../abstract/schedule.dao';
import { IScheduleInputData } from '../../interfaces/schedule.interface';
import { deglobalizeField, getFromIdFromRelId, getNodes, getToIdFromRelId, graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import { QueryResult, RecordShape } from 'neo4j-driver';
import Course from '../../models/abstract/course.model';
import DatabaseCourse from '../../models/implementations/databaseCourse.model';
import { decodeText } from '../../helpers/string.helper';

export default class DatabaseScheduleDao extends ScheduleDao {
    private static instance: ScheduleDao;

    static getInstance = () => {
        if (!DatabaseScheduleDao.instance) {
            DatabaseScheduleDao.instance = new DatabaseScheduleDao();
        }
        return DatabaseScheduleDao.instance;
    };

    async init(): Promise<void> {
    }

    async getScheduleInfo(universityId: string, programId: string, termId: string, studentId: string): Promise<IScheduleInputData> {
        const session = graphDriver.session();
        try {
            // We get enabled courses
            const coursesResult = await session.run(
                'MATCH (s:Student {id: $studentId})-[:COMPLETED]->(c:Course) ' +
                'WITH collect(c) AS completedCourses, sum(c.creditValue) AS completedCredits' +
                'MATCH (fc:Course)-[r:IN]->(:Program {id: $programId}) ' +
                'WHERE NOT fc IN completedCourses AND NOT EXISTS {(fc)-[:REQUIRES]->(req) WHERE NOT req IN completedCourses} AND r.requiredCredits <= completedCredits ' +
                'RETURN {properties: fc{.*, optional:r.optional}}',
                {programId, studentId}
            );
            const courseInfo = this.parseCourses(coursesResult);
            
            // We get courseClasses
            const courseIds: string[] = [...courseInfo.mandatoryCourseIds, ...courseInfo.optionalCourseIds];
            const cclResult = await session.run(
                'MATCH (t:Term {id: $termId}) ' +
                'UNWIND $courseIds as courseId ' +
                'MATCH (:Course {id: courseId})<-[:OF]-(cc:CourseClass)',
                {}
            );
            // We get building distances
            const distancesResult = await session.run(
                'MATCH ()-[r:DISTANCE_TO]->()-[:BELONGS_TO]->(:University {id: $universityId}) RETURN DISTINCT r',
                {universityId, programId, termId, studentId}
            );
            const distanceMap = this.parseDistanceMap(distancesResult);
        } catch (err) {
            throw parseErrors(err, '[ScheduleDao:getScheduleInfo]');
        } finally {
            await session.close();
        }
    }

    private parseCourses(result: QueryResult<RecordShape>): {courses: Map<string,Course>, mandatoryCourseIds: string[], optionalCourseIds: string[]} {
        const nodes = getNodes(result);
        const courses: Map<string, Course> = new Map();
        const mandatoryCourseIds: string[] = [];
        const optionalCourseIds: string[] = [];
        for (const node of nodes) {
            const course = new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.creditValue);
            courses.set(course.id, course);
            (node.optional ? optionalCourseIds : mandatoryCourseIds).push(course.id);
        }
        return {
            courses,
            mandatoryCourseIds,
            optionalCourseIds
        }
    }

    private parseDistanceMap(result: QueryResult<RecordShape>): Map<string, Map<string, number>> {
        const nodes = getNodes(result);
        const distanceMap: Map<string, Map<string, number>> = new Map();
        for (const node of nodes) {
            const fromId = getFromIdFromRelId(node.relId);
            const toId = getToIdFromRelId(node.relId);
            const distance = node.distance as number;
            if (distanceMap.get(fromId) === undefined) distanceMap.set(fromId, new Map());
            distanceMap.get(fromId)!.set(toId, distance);
        }
        return distanceMap;
    }
}
