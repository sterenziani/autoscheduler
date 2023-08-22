import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { ProgramController } from '../controllers/program.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';
import pagingMiddleware from '../middlewares/paging.middleware';

export class ProgramRoutes {
    public router: Router = Router();
    public controller: ProgramController = new ProgramController();

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

        this.router.post('/', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.createProgram);
        this.router.put(
            '/:programId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.updateProgram,
        );
        this.router.get('/:programId', this.controller.getProgram);
        this.router.get('/:programId/courses/mandatory', pagingMiddleware, this.controller.getProgramMandatoryCourses);
        this.router.get('/:programId/courses/optional', pagingMiddleware, this.controller.getProgramOptionalCourses);
    }
}
