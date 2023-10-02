import { graphDriver, logErrors, deglobalizeField, getValue, getNodes } from '../../helpers/persistence/graphPersistence.helper';
import { decodeText } from '../../helpers/string.helper';
import { IProgramCourses } from "../../interfaces/program.interfaces";
import Program from "../abstract/program.model";
import Course from "../abstract/course.model";
import CourseClass from "../abstract/courseClass.model";
import DatabaseCourseClass from "./databaseCourseClass.model";

export default class DatabaseCourse extends Course {
    private requiredCoursesCache: {[programId: string]: {requiredCourses: Course[] | undefined}} = {};
    private courseClassesCache: {[courseId: string]: {courseClasses: CourseClass[] | undefined}} = {};
    private correlativesCache: {[courseId: string]: {correlatives: number | undefined}} = {};

    public async getRequiredCoursesForProgram(programId: string): Promise<Course[] | undefined> {
        // Check cache first
        const cacheHit = this.requiredCoursesCache[programId];
        if (cacheHit !== undefined) return cacheHit.requiredCourses;

        const collection: DatabaseCourse[] = [];
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (c:Course {id: $id})-[r:REQUIRES {programId: $programId}]->(c2:Course) RETURN c2',
                {id: this.id, programId}
            );
            const nodes = getNodes(result);

            for (const node of nodes) {
                collection.push(this.nodeToCourse(node));
            }
            this.requiredCoursesCache[programId] = { requiredCourses: collection };
            return collection;
        } catch (err) {
            logErrors(err, '[Course:getRequiredCoursesForProgram]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async getAmountOfIndirectCorrelatives(programId: string): Promise<number | undefined> {
        // Check cache first
        const cacheHit = this.correlativesCache[this.id];
        if (cacheHit !== undefined) return cacheHit.correlatives;

        const collection: DatabaseCourseClass[] = [];
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (c:Course {id: $id})<-[r:REQUIRES* {programId: $programId}]-(c2:Course) RETURN count(c2) as correlatives',
                {id: this.id, programId}
            );
            const correlatives = getValue<number | undefined>(result, 'correlatives');
            this.correlativesCache[this.id] = { correlatives: correlatives };
            return correlatives;
        } catch (err) {
            logErrors(err, '[Course:getAmountOfIndirectCorrelatives]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async getCourseClasses(termId: string): Promise<CourseClass[] | undefined> {
        // Check cache first
        const cacheHit = this.courseClassesCache[this.id];
        if (cacheHit !== undefined) return cacheHit.courseClasses;

        const collection: DatabaseCourseClass[] = [];
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (:Term {id: $termId})<-[:HAPPENS_IN]-(cc:CourseClass)-[:OF]->(c:Course {id: $id}) RETURN cc',
                {id: this.id, termId}
            );
            const nodes = getNodes(result);

            for (const node of nodes) {
                collection.push(this.nodeToCourseClass(node));
            }
            this.courseClassesCache[this.id] = { courseClasses: collection };
            return collection;
        } catch (err) {
            logErrors(err, '[Course:getCourseClasses]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    private nodeToCourse(node: any): DatabaseCourse {
        return new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.creditValue);
    }

    private nodeToCourseClass(node: any): DatabaseCourseClass {
        return new DatabaseCourseClass(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding));
    }
}
