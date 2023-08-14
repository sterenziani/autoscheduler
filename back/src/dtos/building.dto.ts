import { IDistanceToBuilding } from '../interfaces/building.interface';
import Building from '../models/abstract/building.model';

export const buildingToDto = (building: Building, distances: IDistanceToBuilding[]): IBuildingDto => {
    const distanceDtos: IDistanceDto[] = distances.map((d) => {
        return {
            buildingId: d.buildingId,
            buildingUrl: getBuildingUrl(d.buildingId),
            time: d.time,
        };
    });

    return {
        id: building.id,
        url: getBuildingUrl(building.id),
        name: building.name,
        code: building.internalId,
        distances: distanceDtos,
    };
};

export const getBuildingUrl = (buildingId: string): string => {
    return `building/${buildingId}`;
};

interface IBuildingDto {
    id: string;
    url: string;
    name: string;
    code: string;
    distances: IDistanceDto[];
}

interface IDistanceDto {
    buildingId: string;
    buildingUrl: string;
    time: number;
}
