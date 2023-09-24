import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { graphDriver, logErrors, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import Building from '../abstract/building.model';
import University from '../abstract/university.model';
import DatabaseUniversity from './databaseUniversity.model';

export default class DatabaseBuilding extends Building {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async setDistanceInMinutesTo(buildingId: string, distance: number): Promise<void> {
        const firstId = `${this.id}-${buildingId}`;
        const secondId = `${buildingId}-${this.id}`;
        const session = graphDriver.session();
        try {
            // We try to set existing relationships first, if it fails then we create them
            const setResult = await session.run(
                'MATCH ()-[r:DISTANCE_TO]->() WHERE r.id = $firstId OR r.id = $secondId SET r.distance = $distance',
                {firstId, secondId, distance}
            );
            if (setResult.summary.counters.updates().propertiesSet !== 0) return;
            // If no relation found, we need to create them
            const result = await session.run(
                'MATCH (b1:Building {id: $thisId})-[:BELONGS_TO]->(:University)<-[:BELONGS_TO]-(b2:Building {id: $otherId}) ' +
                'CREATE (b1)-[:DISTANCE_TO {id: $firstId, distance: $distance}]->(b2)-[:DISTANCE_TO {id: $secondId, distance: $distance}]->(b1)',
                {thisId: this.id, otherId: buildingId, firstId, secondId, distance}
            );
            if (result.summary.counters.updates().relationshipsCreated == 0) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
        } catch (err) {
            parseErrors(err, '[Building:setDistanceInMinutesTo]', ERRORS.BAD_REQUEST.BUILDING_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    public async getDistanceInMinutesTo(buildingId: string): Promise<number | undefined> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH ()-[r:DISTANCE_TO {id: $id}]->() RETURN r.distance as distance',
                {id: `${this.id}-${buildingId}`}
            );
            return result.records[0]?.get('distance') as number | undefined;
        } catch (err) {
            logErrors(err, '[Building:getDistanceInMinutesTo]');
            return undefined;
        } finally {
            await session.close();
        }
    }

    public async deleteDistanceInMinutesTo(buildingId: string): Promise<void> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (:Building {id: $thisId})<-[r:DISTANCE_TO]->(:Building {id: $otherId}) DELETE r',
                {thisId: this.id, otherId: buildingId}
            );
            if (result.summary.counters.updates().relationshipsDeleted == 0) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
        } catch (err) {
            parseErrors(err, '[Building:deleteDistanceInMinutesTo]', ERRORS.CONFLICT.CANNOT_DELETE);
        } finally {
            await session.close();
        }
    }

    public async getUniversity(): Promise<University> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (:Building {id: $thisId})-[:BELONGS_TO]->(u: University) RETURN u',
                {thisId: this.id}
            );
            const node = result.records[0]?.get(0)?.properties;
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return new DatabaseUniversity()
        } catch (err) {
            parseErrors(err, '[Building:getUniveristy]');
        } finally {
            await session.close();
        }
    }
}
