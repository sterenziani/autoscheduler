import { graphDriver, logErrors, deglobalizeField, getNodes } from '../../helpers/persistence/graphPersistence.helper';
import { decodeText } from '../../helpers/string.helper';
import Course from "../abstract/course.model";
import Student from "../abstract/student.model";
import DatabaseCourse from "./databaseCourse.model";

export default class DatabaseStudent extends Student {
    private enabledCoursesCache: {[programId: string]: {enabledCourses: Course[] }} = {};

    public async getEnabledCourses(programId: string): Promise<Course[] | undefined> {
        // Check cache first
        const cacheHit = this.enabledCoursesCache[programId];
        if (cacheHit !== undefined) return cacheHit.enabledCourses;

        const collection: DatabaseCourse[] = [];
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (s:Student {id: $id})-[:COMPLETED]->(c:Course) WITH collect(c) AS completedCourses ' +
                'MATCH (fc:Course)-[:IN]->(:Program {id: $programId}) WHERE NOT fc IN completedCourses AND ' +
                'NOT EXISTS { (fc)-[:REQUIRES {programId: $programId}]->(req:Course) WHERE NOT req IN completedCourses } RETURN fc',
                {id: this.id, programId}
            );
            const nodes = getNodes(result);

            for (const node of nodes) {
                collection.push(this.nodeToCourse(node));
            }
            this.enabledCoursesCache[programId] = { enabledCourses: collection };
            return collection;
        } catch (err) {
            logErrors(err, '[Student:getEnabledCourses]');
            return undefined;
        } finally {
            await session.close();
        }
    }    

    private nodeToCourse(node: any): DatabaseCourse {
        return new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding));
    }
}
