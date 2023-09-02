import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { StudentController } from '../controllers/student.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
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

        this.router.get('/', authUsersOnlyMiddleware, studentsOnlyMiddleware, this.controller.getActiveStudent);
        this.router.post('/', this.controller.createStudent);
        this.router.get('/:userId', authUsersOnlyMiddleware, studentsOnlyMiddleware, this.controller.getStudent);
        this.router.get('/:userId/remaining-courses/:programId', authUsersOnlyMiddleware, studentsOnlyMiddleware, this.controller.getRemainingCourses);
        this.router.get('/:userId/schedules', authUsersOnlyMiddleware, studentsOnlyMiddleware, this.controller.getSchedules);
        this.router.get(
            '/:userId/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentCompletedCourses,
        );
        this.router.post(
            '/:userId/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.addStudentCompletedCourses,
        );
        this.router.delete(
            '/:userId/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.removeStudentCompletedCourses,
        );
    }
}
