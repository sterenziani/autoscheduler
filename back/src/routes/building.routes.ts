import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { BuildingController } from '../controllers/building.controller';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/userAuth.middleware';
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

        this.router.post('/', userAuthMiddleware, universitiesOnlyMiddleware, this.controller.createBuilding);
        this.router.get('/:buildingId', this.controller.getBuilding);
        this.router.delete(
            '/:buildingId',
            userAuthMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteBuilding,
        );
    }
}
