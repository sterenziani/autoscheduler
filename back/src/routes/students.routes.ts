import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { StudentsController } from '../controllers/students.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import studentsOnlyMiddleware from '../middlewares/studentsOnly.middleware';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';

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
            this.controller.getStudents
        );
        this.router.get(
            '/:studentId',
            authUsersOnlyMiddleware,
            adminOnlyMiddleware,
            this.controller.getStudent
        );
        this.router.put(
            '/:studentId',
            authUsersOnlyMiddleware,
            adminOnlyMiddleware,
            this.controller.modifyStudentForAdmin
        );
        this.router.post(
            '/',
            this.controller.createStudent
        );
    }
}
