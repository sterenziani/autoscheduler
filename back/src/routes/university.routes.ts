import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversityController } from '../controllers/university.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';
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

        this.router.get('/', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.getActiveUniversity);
        this.router.post('/', this.controller.createUniversity);
        this.router.get('/:userId', this.controller.getUniversity);
        this.router.get('/:userId/programs', pagingMiddleware, this.controller.getUniversityPrograms);
        this.router.get('/:userId/courses', pagingMiddleware, this.controller.getUniversityCourses);
        this.router.get('/:userId/buildings', pagingMiddleware, this.controller.getUniversityBuildings);
        this.router.get('/:userId/terms', pagingMiddleware, this.controller.getUniversityTerms);
        this.router.put('/:userId/verified', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.editUniversityVerificationStatus);
    }
}
