import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UserController } from '../controllers/user.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';

export class UserRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: UserController = new UserController();

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
        this.router.get('/', authUsersOnlyMiddleware, this.controller.getUser);
        this.router.put('/', authUsersOnlyMiddleware, this.controller.modifyUser);
    }
}
