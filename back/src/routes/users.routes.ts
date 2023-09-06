import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UsersController } from '../controllers/users.controller';
import cors from 'cors';

export class UsersRoutes {
    public router: Router = Router();
    public controller: UsersController = new UsersController();

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
        this.router.post('/token', this.controller.createResetToken);
        this.router.get('/token/:token', this.controller.getUserWithResetToken);
        this.router.put('/:userId/password', this.controller.changeUserPassword);
    }
}
