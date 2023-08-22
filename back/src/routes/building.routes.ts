import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { BuildingController } from '../controllers/building.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';

export class BuildingRoutes {
    public router: Router = Router();
    public controller: BuildingController = new BuildingController();

    constructor() {
        this.init();
    }

    public init() {
        this.router.use(
            urlencoded({
                extended: true,
            }),
        );

        this.router.use(cors());

        this.router.post('/', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.createBuilding);
        this.router.put(
            '/:buildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.updateBuilding,
        );
        this.router.get('/:buildingId', this.controller.getBuilding);
        this.router.delete(
            '/:buildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteBuilding,
        );
    }
}
