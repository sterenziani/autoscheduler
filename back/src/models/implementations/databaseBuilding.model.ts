import { getRelId, getValue, graphDriver, logErrors } from '../../helpers/persistence/graphPersistence.helper';
import Building from '../abstract/building.model';

// TODO: this cache approach is bad, it will kill the pod memory quickly. Cache should be done on Schedule.service
export default class DatabaseBuilding extends Building {
    // I made a second object so we can tell apart undefined from it not being set in cache yet from undefined from it not being set in db
    static distancesCache: {[relId: string]: {distance: number | undefined}} = {};

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getDistanceInMinutesTo(other: Building): Promise<number | undefined> {
        // Get relIds
        const relId = getRelId('BB', this.id, other.id);
        const counterRelId = getRelId('BB', other.id, this.id);
        // Check cache first
        const cacheHit = DatabaseBuilding.distancesCache[relId];
        if (cacheHit !== undefined) return cacheHit.distance;
        
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH ()-[r:DISTANCE_TO {relId: $relId}]->() RETURN r.distance as distance',
                {relId}
            );
            const distance = getValue<number | undefined>(result, 'distance');
            DatabaseBuilding.distancesCache[relId] = {distance: distance};
            DatabaseBuilding.distancesCache[counterRelId] = {distance: distance};
            return distance;
        } catch (err) {
            logErrors(err, '[Building:getDistanceInMinutesTo]');
            return undefined;
        } finally {
            await session.close();
        }
    }
}
