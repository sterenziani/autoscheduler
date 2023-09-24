import { graphDriver, logErrors } from '../../helpers/persistence/graphPersistence.helper';
import Building from '../abstract/building.model';

export default class DatabaseBuilding extends Building {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getDistanceInMinutesTo(other: Building): Promise<number | undefined> {
        // Check cache first
        const cacheHit = this.getDistanceFromCache(other) ?? other.getDistanceFromCache(this);
        if (cacheHit !== undefined) return cacheHit.distance;
        
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH ()-[r:DISTANCE_TO {id: $id}]->() RETURN r.distance as distance',
                {id: `${this.id}-${other.id}`}
            );
            const distance = result.records[0]?.get('distance') as number | undefined;
            this.saveDistanceToCache(other, distance);
            other.saveDistanceToCache(this, distance);
            return distance;
        } catch (err) {
            logErrors(err, '[Building:getDistanceInMinutesTo]');
            return undefined;
        } finally {
            await session.close();
        }
    }
}
