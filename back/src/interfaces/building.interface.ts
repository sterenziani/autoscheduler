export interface IBuildingDistance {
    buildingId: string;
    distance: number;
}

// For input only, response should be array of IBuildingDistance (or their corresponding dto)
export interface IBuildingDistancesInput {
    [buildingId: string]: number;
}
