import BuildingService from '../services/building.service';
import { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants/http.constants';
import * as BuildingDto from '../dtos/building.dto';
import { IDistanceToBuilding } from '../interfaces/building.interface';
import Building from '../models/abstract/building.model';

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
        const internalId = req.body.email as string;
        const name = req.body.name as string;
        const distances = req.body.distances as { [internalId: string]: number };

        try {
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

    public deleteBuilding: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const buildingId = req.params.buildingId;

        try {
            await this.buildingService.deleteBuilding(userInfo.id, buildingId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };
}
