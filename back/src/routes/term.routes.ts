import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { TermController } from '../controllers/term.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';

export class TermRoutes {
    public router: Router = Router();
    public controller: TermController = new TermController();

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

        this.router.post('/', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.createTerm);
        this.router.get('/:termId', this.controller.getTerm);
        this.router.put('/:termId', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.modifyTerm);
        this.router.delete('/:termId', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.deleteTerm);
    }
}
