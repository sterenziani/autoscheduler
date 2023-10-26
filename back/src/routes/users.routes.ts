import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UsersController } from '../controllers/users.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';

export class UsersRoutes {
    public router: Router = Router({mergeParams: true});
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
        this.router.get('/', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.getUsers);
        this.router.get('/:userId', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.getUser);
        this.router.post('/', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.createAdminUser);
        this.router.put('/:userId', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.modifyUser);
        this.router.delete('/:userId', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.deleteUser);
    }
}
