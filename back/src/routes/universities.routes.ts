import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversityController } from '../controllers/university.controller';
import cors from 'cors';
import pagingMiddleware from '../middlewares/paging.middleware';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';

export class UniversitiesRoutes {
    public router: Router = Router({mergeParams: true});
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
        this.router.post('/', this.controller.createUniversity);
        this.router.get('/:universityId', this.controller.getUniversity);
        this.router.get('/:universityId/user', this.controller.getUniversityUser);
        this.router.get('/:universityId/programs', pagingMiddleware, this.controller.getUniversityPrograms);
        this.router.get('/:universityId/courses', pagingMiddleware, this.controller.getUniversityCourses);
        this.router.get('/:universityId/buildings', pagingMiddleware, this.controller.getUniversityBuildings);
        this.router.get('/:universityId/terms', pagingMiddleware, this.controller.getUniversityTerms);
        this.router.put('/:universityId/verified', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.editUniversityVerificationStatus);
    }
}
