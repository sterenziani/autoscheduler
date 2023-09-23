import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { StudentController } from '../controllers/student.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import studentsOnlyMiddleware from '../middlewares/studentsOnly.middleware';

export class StudentRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: StudentController = new StudentController();

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

        this.router.get(
            '/',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getActiveStudent
        );
    }
}
