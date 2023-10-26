import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';
import { StudentsController } from '../controllers/students.controller';

export class StudentsRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: StudentsController = new StudentsController();

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

        // /students routes
        this.router.get(
            '/',
            authUsersOnlyMiddleware,
            adminOnlyMiddleware,
            this.controller.getStudentsForAdmin
        );
        this.router.get(
            '/:studentId',
            authUsersOnlyMiddleware,
            adminOnlyMiddleware,
            this.controller.getStudentForAdmin
        );
        this.router.put(
            '/:studentId',
            authUsersOnlyMiddleware,
            adminOnlyMiddleware,
            this.controller.modifyStudentForAdmin
        );
    }
}
