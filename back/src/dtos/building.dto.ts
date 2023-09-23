import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { applyPathToBase, getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';
import Building from '../models/abstract/building.model';

export const buildingToDto = (building: Building, scope: API_SCOPE): IBuildingDto => {
    const url = getResourceUrl(RESOURCES.BUILDING, scope, building.id);
    return {
        id: building.id,
        internalId: building.internalId,
        name: building.name,
        url,
        distancesUrl: applyPathToBase(url, 'distances')
    };
};

export const paginatedBuildingsToDto = (paginatedBuildings: PaginatedCollection<Building>, scope: API_SCOPE): IBuildingDto[] => {
    return paginatedBuildings.collection.map(b => buildingToDto(b, scope));
};

export const paginatedBuildingsToLinks = (paginatedBuildings: PaginatedCollection<Building>, basePath: string, limit: number, filter?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedBuildings, paginatedBuildingsUrlBuilder, basePath, limit, filter);
};

const paginatedBuildingsUrlBuilder = (basePath: string, page: string, limit: string, filter?: string): string => {
    const params = {
        page,
        limit,
        filter
    };
    return queryParamsStringBuilder(basePath, params);
};

interface IBuildingDto {
    id: string;
    internalId: string;
    name: string;
    url: string;
    distancesUrl: string;
}
