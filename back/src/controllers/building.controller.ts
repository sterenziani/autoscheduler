import BuildingService from '../services/building.service';
import { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants/http.constants';
import * as BuildingDto from '../dtos/building.dto';
import { IDistanceToBuilding } from '../interfaces/building.interface';
import Building from '../models/abstract/building.model';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export class BuildingController {
    private buildingService: BuildingService;

    constructor() {
        this.buildingService = BuildingService.getInstance();
    }

    public getBuilding: RequestHandler = async (req, res, next) => {
        const buildingId = req.params.buildingId;

        try {
            const building: Building = await this.buildingService.getBuilding(buildingId);
            const distances: IDistanceToBuilding[] = await this.buildingService.getBuildingDistances(building.id);
            res.status(HTTP_STATUS.OK).send(BuildingDto.buildingToDto(building, distances));
        } catch (e) {
            next(e);
        }
    };

    public createBuilding: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const internalId = req.body.internalId as string;
        const name = req.body.name as string;
        const distances = req.body.distances as { [buildingId: string]: number } | undefined;

        if (!internalId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            if(distances) await this.validateDistancesMap(distances);
            const building: Building = await this.buildingService.createBuilding(
                userInfo.id,
                internalId,
                name,
                distances,
            );
            res.status(HTTP_STATUS.CREATED).location(BuildingDto.getBuildingUrl(building.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public updateBuilding: RequestHandler = async (req, res, next) => {
        const buildingId = req.params.buildingId;
        const userInfo = req.user;

        const internalId = req.body.internalId as string;
        const name = req.body.name as string;
        const distances = req.body.distances as { [buildingId: string]: number } | undefined;

        if (!internalId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));
        if(distances) await this.validateDistancesMap(distances);

        try {
            await this.verifyOwnership(buildingId, userInfo.id);
            const building: Building = await this.buildingService.updateBuilding(
                buildingId,
                internalId,
                name,
                distances,
            );
            res.status(HTTP_STATUS.OK).location(BuildingDto.getBuildingUrl(building.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public deleteBuilding: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const buildingId = req.params.buildingId;

        try {
            await this.verifyOwnership(buildingId, userInfo.id);
            await this.buildingService.deleteBuilding(buildingId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    private verifyOwnership = async (buildingId: string, userId: string) => {
        const building = await this.buildingService.getBuilding(buildingId);
        const buildingUniversity = await building.getUniversity();
        if (buildingUniversity.id !== userId) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);
    }

    private validateDistancesMap = async (distances: { [buildingId: string]: number }) => {
        const differentBuildingIds: Set<string> = new Set();
        for (const buildingId of Object.keys(distances)) {
            if (differentBuildingIds.has(buildingId)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
            if (typeof distances[buildingId] !== 'number')
                throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS);
            differentBuildingIds.add(buildingId);
        }
    }
}
