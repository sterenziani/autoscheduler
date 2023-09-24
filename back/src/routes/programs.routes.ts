import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { ProgramsController } from '../controllers/programs.controller';
import cors from 'cors';
import pagingMiddleware from '../middlewares/paging.middleware';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';

export class UniversitiesRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: ProgramsController = new ProgramsController();

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

        // /programs routes
        this.router.get(
            '/:programId',
            pagingMiddleware,
            this.controller.getProgram
        );
    }
}
