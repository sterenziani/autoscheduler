import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { ProgramsController } from '../controllers/programs.controller';
import cors from 'cors';

export class ProgramsRoutes {
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
        this.router.get('/:programId', this.controller.getProgram);
    }
}
