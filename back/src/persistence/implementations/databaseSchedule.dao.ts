import ScheduleDao from '../abstract/schedule.dao';
import { IScheduleInputData } from '../../interfaces/schedule.interface';
import { deglobalizeField, getFromIdFromRelId, getValue, getNodes, getToIdFromRelId, graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import { QueryResult, RecordShape } from 'neo4j-driver';
import Course from '../../models/abstract/course.model';
import DatabaseCourse from '../../models/implementations/databaseCourse.model';
import { decodeText } from '../../helpers/string.helper';
import CourseClass from '../../models/abstract/courseClass.model';
import DatabaseCourseClass from '../../models/implementations/databaseCourseClass.model';
import Lecture from '../../models/abstract/lecture.model';
import DatabaseLecture from '../../models/implementations/databaseLecture.model';
import Time from '../../helpers/classes/time.class';
import TimeRange from '../../helpers/classes/timeRange.class';

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
            // We get optional credits remaining to graduate
            const remainingOptionalCreditsResult = await session.run(
                'MATCH (s:Student {id:$studentId})-[:FOLLOWS]->(p:Program {id:$programId}) '+
                'OPTIONAL MATCH (s)-[:COMPLETED]->(c:Course)-[:IN {optional:true}]->(p) WITH p, SUM(c.creditValue) AS finishedOptionalCredits '+
                'RETURN p.optionalCourseCredits-finishedOptionalCredits AS remainingOptionalCredits',
                {programId, studentId}
            );
            const remainingOptionalCredits = getValue<number>(remainingOptionalCreditsResult, 'remainingOptionalCredits');

            // We get enabled courses
            const coursesResult = await session.run(
                'MATCH (s:Student {id: $studentId})-[:COMPLETED]->(c:Course) ' +
                'WITH collect(c) AS completedCourses, sum(c.creditValue) AS completedCredits ' +
                'MATCH (:Program {id: $programId})<-[r:IN]-(fc:Course) ' +
                'OPTIONAL MATCH (fc)<-[:REQUIRES* {programId: $programId}]-(rq:Course) ' +
                'WITH fc, r, completedCourses, completedCredits, count(rq) AS ica ' +
                'WHERE NOT fc IN completedCourses AND NOT EXISTS {(fc)-[:REQUIRES]->(req) WHERE NOT req IN completedCourses} AND r.requiredCredits <= completedCredits ' +
                'RETURN {properties: fc{.*, optional:r.optional, indirectCorrelativesAmount:ica}}',
                {programId, studentId}
            );
            const courseInfo = this.parseCourses(coursesResult);

            // We get courseClasses
            const courseIds: string[] = [...courseInfo.mandatoryCourseIds, ...courseInfo.optionalCourseIds];
            const courseClassResult = await session.run(
                'UNWIND $courseIds as courseId ' +
                'MATCH (c:Course {id: courseId})<-[:OF]-(cc:CourseClass)-[:HAPPENS_IN]->(:Term {id: $termId}) ' +
                'MATCH (cc)<-[:OF]-(l: Lecture) ' +
                'WITH cc, c.id AS cId, sum(duration.between(l.startTime, l.endTime)) AS duration ' +
                'RETURN {properties: cc{.*, courseId:cId, termId:$termId, weeklyClassTimeInMinutes: duration.minutes}}',
                {courseIds, termId}
            );
            const courseClassInfo = this.parseCourseClasses(courseClassResult);

            // We get lectures
            const courseClassIds: string[] = courseClassInfo.courseClassIds;
            const lecturesResult = await session.run(
                'UNWIND $courseClassIds as courseClassId ' +
                'MATCH (b:Building)<-[:TAKES_PLACE_IN]-(l:Lecture)-[:OF]->(cc:CourseClass {id:courseClassId}) ' +
                'RETURN {properties: l{.*, buildingId: b.id, courseClassId: cc.id}}',
                {courseClassIds}
            );
            const lectureInfo = this.parseLectures(lecturesResult);

            // We get building distances
            const distancesResult = await session.run(
                'MATCH (: Building)-[r:DISTANCE_TO]->(: Building)-[:BELONGS_TO]->(:University {id: $universityId}) RETURN DISTINCT r',
                {universityId, programId, termId, studentId}
            );
            const distanceMap = this.parseDistanceMap(distancesResult);

            // We generate return object based on queried data
            return {
                courses: courseInfo.courses,
                courseClasses: courseClassInfo.courseClasses,
                lectures: lectureInfo.lectures,
                mandatoryCourseIds: courseInfo.mandatoryCourseIds,
                optionalCourseIds: courseInfo.optionalCourseIds,
                indirectCorrelativesAmount: courseInfo.indirectCorrelativesAmount,
                weeklyClassTimeInMinutes: courseClassInfo.weeklyClassTimeInMinutes,
                courseClassesOfCourse: courseClassInfo.courseClassesOfCourse,
                courseOfCourseClass: courseClassInfo.courseOfCourseClass,
                lecturesOfCourseClass: lectureInfo.lecturesOfCourseClass,
                lectureBuilding: lectureInfo.lectureBuilding,
                distances: distanceMap,
                remainingOptionalCredits: remainingOptionalCredits
            }
        } catch (err) {
            throw parseErrors(err, '[ScheduleDao:getScheduleInfo]');
        } finally {
            await session.close();
        }
    }

    private parseCourses(result: QueryResult<RecordShape>): {courses: Map<string,Course>, mandatoryCourseIds: string[], optionalCourseIds: string[], indirectCorrelativesAmount: Map<string, number>,} {
        const nodes = getNodes(result);
        const courses: Map<string, Course> = new Map();
        const mandatoryCourseIds: string[] = [];
        const optionalCourseIds: string[] = [];
        const indirectCorrelativesAmount: Map<string, number> = new Map();
        for (const node of nodes) {
            const course = new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.creditValue);
            courses.set(course.id, course);
            (node.optional ? optionalCourseIds : mandatoryCourseIds).push(course.id);
            indirectCorrelativesAmount.set(course.id, node.indirectCorrelativesAmount);
        }
        return {
            courses,
            mandatoryCourseIds,
            optionalCourseIds,
            indirectCorrelativesAmount,
        }
    }

    private parseCourseClasses(result: QueryResult<RecordShape>): {courseClasses: Map<string, CourseClass>, courseClassIds: string[], courseClassesOfCourse: Map<string, string[]>, courseOfCourseClass: Map<string, string>, weeklyClassTimeInMinutes: Map<string, number>} {
        const nodes = getNodes(result);
        const courseClasses: Map<string, CourseClass> = new Map();
        const courseClassIds: string[] = [];
        const courseClassesOfCourse: Map<string, string[]> = new Map();
        const courseOfCourseClass: Map<string, string> = new Map();
        const weeklyClassTimeInMinutes: Map<string, number> = new Map();
        for (const node of nodes) {
            const courseClass = new DatabaseCourseClass(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.courseId, node.termId);
            courseClasses.set(courseClass.id, courseClass);
            courseClassIds.push(courseClass.id);
            if (!courseClassesOfCourse.has(courseClass.courseId)) courseClassesOfCourse.set(courseClass.courseId, []);
            courseClassesOfCourse.get(courseClass.courseId)?.push(courseClass.id);
            courseOfCourseClass.set(courseClass.id, node.courseId);
            weeklyClassTimeInMinutes.set(courseClass.id, node.weeklyClassTimeInMinutes);
        }
        return {
            courseClasses,
            courseClassIds,
            courseClassesOfCourse,
            courseOfCourseClass,
            weeklyClassTimeInMinutes
        }
    }

    private parseLectures(result: QueryResult<RecordShape>): {lectures: Map<string, Lecture>, lecturesOfCourseClass: Map<string, string[]>, lectureBuilding: Map<string, string>} {
        const nodes = getNodes(result);
        const lectures: Map<string, Lecture> = new Map();
        const lecturesOfCourseClass: Map<string, string[]> = new Map();
        const lectureBuilding: Map<string, string> = new Map();
        for (const node of nodes) {
            const startTime = Time.fromString(node.startTime);
            const endTime = Time.fromString(node.endTime);
            const lecture = new DatabaseLecture(node.id, new TimeRange(node.dayOfWeek, startTime, endTime), node.buildingId);
            lectures.set(lecture.id, lecture);
            if(!lecturesOfCourseClass.has(node.courseClassId)) lecturesOfCourseClass.set(node.courseClassId, []);
            lecturesOfCourseClass.get(node.courseClassId)?.push(lecture.id);
            lectureBuilding.set(lecture.id, node.buildingId);
        }
        return {
            lectures,
            lecturesOfCourseClass,
            lectureBuilding
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
