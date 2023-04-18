import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import { getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import Building from "../../abstract/building.model";
import University from "../../abstract/university.model";

export default class MemoryBuilding extends Building {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async setDistanceInMinutesTo(buildingId: string, distance: number): Promise<void> {
        // First we check if there is a distance map created for this building
        if (!MEMORY_DATABASE.distanceBetweenBuildings.get(this.id))
            MEMORY_DATABASE.distanceBetweenBuildings.set(this.id, new Map());
        
        // Now we update the distance map
        MEMORY_DATABASE.distanceBetweenBuildings.get(this.id)!.set(buildingId, distance);
    }

    public async getDistanceInMinutesTo(buildingId: string): Promise<number | undefined> {
        return MEMORY_DATABASE.distanceBetweenBuildings.get(this.id)?.get(buildingId);
    }

    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(MEMORY_DATABASE.buildingsOfUniversity, MEMORY_DATABASE.universities, this.id);
        if (!maybeUniversity) throw new Error('Building is not associated with any university. Data is probably corrupted');
        return maybeUniversity;
    }

}