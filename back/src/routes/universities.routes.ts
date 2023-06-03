import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversityController } from '../controllers/university.controller';
import cors from 'cors';
import pagingMiddleware from '../middlewares/paging.middleware';

export class UniversitiesRoutes {
    public router: Router = Router();
    public controller: UniversityController = new UniversityController();

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

        this.router.get('/', pagingMiddleware, this.controller.getUniversities);
    }
}
