import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversitiesController } from '../controllers/universities.controller';
import cors from 'cors';
import pagingMiddleware from '../middlewares/paging.middleware';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';

export class UniversitiesRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: UniversitiesController = new UniversitiesController();

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


        // /universities routes
        this.router.get(
            '/',
            pagingMiddleware,
            this.controller.getUniversities
        );
        this.router.get(
            '/:universityId',
            this.controller.getUniversity
        );
        this.router.put(
            '/:universityId',
            authUsersOnlyMiddleware,
            adminOnlyMiddleware,
            this.controller.modifyUniversityForAdmin
        );
        this.router.post(
            '/',
            this.controller.createUniversityRegister
        );

        // /universities/:universityId/programs routes
        this.router.get(
            '/:universityId/programs',
            pagingMiddleware,
            this.controller.getUniversitiesPrograms
        );
        this.router.get(
            '/:universityId/programs/:programId',
            pagingMiddleware,
            this.controller.getUniversitiesPrograms
        );
    }
}
