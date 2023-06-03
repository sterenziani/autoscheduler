import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversityController } from '../controllers/university.controller';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/userAuth.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';
import pagingMiddleware from '../middlewares/paging.middleware';

export class UniversityRoutes {
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

        this.router.get('/', userAuthMiddleware, universitiesOnlyMiddleware, this.controller.getActiveUniversity);
        this.router.post('/', this.controller.createUniversity);
        this.router.get('/:userId', this.controller.getUniversity);
        this.router.get('/:userId/programs', pagingMiddleware, this.controller.getUniversityPrograms);
        this.router.get('/:userId/courses', pagingMiddleware, this.controller.getUniversityCourses);
    }
}
