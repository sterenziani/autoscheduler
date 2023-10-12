import { graphDriver, logErrors, deglobalizeField, getNode, getNodes } from '../../helpers/persistence/graphPersistence.helper';
import { decodeText } from '../../helpers/string.helper';
import TimeRange from '../../helpers/classes/timeRange.class';
import Time from '../../helpers/classes/time.class';
import Lecture from "../abstract/lecture.model";
import Course from "../abstract/course.model";
import CourseClass from "../abstract/courseClass.model";
import DatabaseLecture from './databaseLecture.model';
import DatabaseCourse from "./databaseCourse.model";

export default class DatabaseCourseClass extends CourseClass {
    private lecturesCache: {[courseClassId: string]: {lectures: Lecture[] }} = {};
    private classTimeInMinutesCache: number | undefined;
    private courseCache: {[courseClassId: string]: {course: Course | undefined }} = {};

    public async getLectures(): Promise<Lecture[] | undefined> {
        // Check cache first
        const cacheHit = this.lecturesCache[this.id];
        if (cacheHit !== undefined) return cacheHit.lectures;

        const collection: DatabaseLecture[] = [];
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (b:Building)<-[:TAKES_PLACE_IN]-(l:Lecture)-[:OF]->(:CourseClass {id: $id}) RETURN {properties:l{.*, buildingId:b.id}}',
                {id: this.id}
            );
            const nodes = getNodes(result);

            for (const node of nodes) {
                collection.push(this.nodeToLecture(node));
            }
            this.lecturesCache[this.id] = { lectures: collection };
            return collection;
        } catch (err) {
            logErrors(err, '[CourseClass:getLectures]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async getWeeklyClassTimeInMinutes(): Promise<number | undefined> {
        if(this.classTimeInMinutesCache !== undefined) return this.classTimeInMinutesCache;

        const session = graphDriver.session();
        try {
            const lectures = await this.getLectures();
            if(!lectures) return undefined;

            let durationInMinutes = 0;
            for(const l of lectures) {
                durationInMinutes += l.time.getDurationInMinutes();
            }
            this.classTimeInMinutesCache = durationInMinutes;
            return durationInMinutes;
        } catch(err) {
            logErrors(err, '[CourseClass:getWeeklyClassTimeInMinutes]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async getCourse(): Promise<Course | undefined> {
        // Check cache first
        const cacheHit = this.courseCache[this.id];
        if (cacheHit !== undefined) return cacheHit.course;

        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (:CourseClass {id: $id})-[:OF]->(c:Course) RETURN c',
                {id: this.id}
            );
            const node = getNode(result);
            if(!node){
                this.courseCache[this.id] =  {course: undefined};
                return undefined;
            }

            const course = this.nodeToCourse(node);
            this.courseCache[this.id] = {course: course};
            return course;
        } catch (err) {
            logErrors(err, '[CourseClass:getCourse]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    private nodeToLecture(node: any): DatabaseLecture {
        const startTime = Time.fromString(node.startTime);
        const endTime = Time.fromString(node.endTime);
        return new DatabaseLecture(node.id, new TimeRange(node.dayOfWeek, startTime, endTime), node.buildingId);
    }

    private nodeToCourse(node: any): DatabaseCourse {
        return new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.creditValue);
    }
}
