import { graphDriver, logErrors, deglobalizeField, getNodes } from '../../helpers/persistence/graphPersistence.helper';
import { decodeText } from '../../helpers/string.helper';
import { IProgramCourses } from "../../interfaces/program.interfaces";
import DatabaseCourse from "./databaseCourse.model";
import Program from "../abstract/program.model";

export default class DatabaseProgram extends Program {
    private coursesCache: {[programId: string]: {courses: IProgramCourses }} = {};

    public async getCourses(): Promise<IProgramCourses | undefined> {
        // Check cache first
        const cacheHit = this.coursesCache[this.id];
        if (cacheHit !== undefined) return cacheHit.courses;

        const courses: IProgramCourses = {mandatoryCourses: [], optionalCourses: []}
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (c:Course)-[r:IN]->(p:Program {id: $id}) RETURN {properties: c{.*, optional:r.optional}}',
                {id: this.id}
            );
            const nodes = getNodes(result);

            for (const node of nodes) {
                if(node.optional) courses.optionalCourses.push(this.nodeToCourse(node));
                else              courses.mandatoryCourses.push(this.nodeToCourse(node));
            }
            this.coursesCache[this.id] = {courses: courses};
            return courses;
        } catch (err) {
            logErrors(err, '[Program:getCourses]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    private nodeToCourse(node: any): DatabaseCourse {
        return new DatabaseCourse(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.creditValue);
    }
}
