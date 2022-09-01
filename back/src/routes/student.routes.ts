import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { StudentController } from '../controllers/student.controller';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/userAuth.middleware';
import studentsOnlyMiddleware from '../middlewares/studentsOnly.middleware';

export class StudentRoutes {
    public router: Router = Router();
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

        this.router.get('/', userAuthMiddleware, studentsOnlyMiddleware, this.controller.getActiveUser);
        this.router.get('/:userId', userAuthMiddleware, studentsOnlyMiddleware, this.controller.getUser);
        this.router.get(
            '/:userId/courses',
            userAuthMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentApprovedCourses,
        );
    }
}
