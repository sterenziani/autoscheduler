import { ERRORS } from "../../constants/error.constants";
import GenericException from "../../exceptions/generic.exception";

// Given a Map<string, Set<string>> returns the string that has the given value in the Set<string>
// This is not an efficient method, but we are doing this so we dont have to have reverse maps
export const findKeyThatHoldsValueInArray = (map: Map<string, Set<string>>, value: string): string | undefined => {
    for (let [k, v] of map) {
        if (v.has(value))
            return k;
    }

    return undefined;
}

export const getChildsFromParent = <T>(relationshipMap: Map<string, Set<string>>, childEntityMap: Map<string, T>, parentId: string): T[] => {
    // We start response
    let res: T[] = [];

    // We get the ids from the relationshipMap
    const entityIds: Set<string> | undefined = relationshipMap.get(parentId);
    
    // If there are entities, we loop over the ids and get the entities from the entityMap
    if (entityIds) {
        for (const entityId of entityIds) {
            const entity = childEntityMap.get(entityId);
            // If there is no entity then it means relationship has reference to an id of an entity that does not exist, so database is corrupted
            if (!entity) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.CORRUPTED_DATABASE);
            res.push(entity);
        }
    }
    
    return res;
}

// This is similar to getChildsFromParent, except in this case we have 2 parents, so we want the children of both parents and not just one (aka the intersection of the sets)
export const getChildsFromParents = <T>(fatherRelationshipMap: Map<string, Set<string>>, motherRelationshipMap: Map<string, Set<string>>, childEntityMap: Map<string, T>, fatherId: string, motherId: string): T[] => {
    // We start the response
    let res: T[] = [];

    // We get the ids from the father relationship
    const fatherEntityIds: Set<string> | undefined = fatherRelationshipMap.get(fatherId);
    if (!fatherEntityIds) return res;

    // We get the ids from the mother relationship
    const motherEntityIds: Set<string> | undefined = motherRelationshipMap.get(motherId);
    if (!motherEntityIds) return res;

    // We get the intersection
    const entityIds: Set<string> = new Set([...fatherEntityIds].filter(v => motherEntityIds.has(v)));

    // Now we loop over the ids and get the entities from the entityMap
    for (const entityId of entityIds) {
        const entity = childEntityMap.get(entityId);
        // If there is no entity then it means relationship has reference to an id of an entity that does not exist, so database is corrupted
        if (!entity) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.CORRUPTED_DATABASE);
        res.push(entity);
    }

    return res;
}

// TODO: think if undefined makes sense, i think it does for Courses and Programs, but idk
export const getParentFromChild = <T>(relationshipMap: Map<string, Set<string>>, parentEntityMap: Map<string, T>, childId: string): T | undefined => {
    // We get the id of the parent from the relationshipMap
    const parentId = findKeyThatHoldsValueInArray(relationshipMap, childId);

    // If there is no parent we return undefined (I'm not throwing cuz idk if it's always an error if there is no parent)
    if (!parentId) return undefined;

    // We get the parent entity
    const entity = parentEntityMap.get(parentId);
    // If there is no entity then database is corrupted, cuz it means relationship has id of an entity that does not exist
    if (!entity) throw new GenericException(ERRORS.INTERNAL_SERVER_ERROR.CORRUPTED_DATABASE);

    return entity;
}