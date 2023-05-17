import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { ProgramController } from '../controllers/program.controller';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/userAuth.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';

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

        this.router.post('/', userAuthMiddleware, universitiesOnlyMiddleware, this.controller.createProgram);
        this.router.get('/:programId', userAuthMiddleware, this.controller.getProgram);
    }
}
