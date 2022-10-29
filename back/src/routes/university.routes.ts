import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversityController } from '../controllers/university.controller';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/userAuth.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';

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
        this.router.get('/:userId', userAuthMiddleware, universitiesOnlyMiddleware, this.controller.getUniversity);
    }
}
