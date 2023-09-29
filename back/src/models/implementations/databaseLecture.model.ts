import { graphDriver, logErrors, deglobalizeField, getNode } from '../../helpers/persistence/graphPersistence.helper';
import { decodeText } from '../../helpers/string.helper';
import Building from "../abstract/building.model";
import DatabaseBuilding from "./databaseBuilding.model"
import Lecture from "../abstract/lecture.model";

export default class DatabaseLecture extends Lecture {
    private buildingCache: {[lectureId: string]: {building: Building | undefined}} = {};

    public async getBuilding(): Promise<Building | undefined> {
        // Check cache first
        const cacheHit = this.buildingCache[this.id];
        if (cacheHit !== undefined) return cacheHit.building;

        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (:Lecture {id: $id})-[:TAKES_PLACE_IN]->(b:Building) RETURN b',
                {id: this.id}
            );
            const node = getNode(result);
            if (!node){
                this.buildingCache[this.id] = {building: undefined};
                return undefined;
            }

            const building = this.nodeToBuilding(node);
            this.buildingCache[this.id] = {building: building};
            return building;
        } catch (err) {
            logErrors(err, '[Lecture:getBuilding]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    private nodeToBuilding(node: any): DatabaseBuilding {
        return new DatabaseBuilding(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding));
    }
}
