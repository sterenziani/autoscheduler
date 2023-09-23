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
        this.router.post(
            '/',
            this.controller.createStudent
        );
        this.router.get(
            '/:studentId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudent
        );
        this.router.get(
            '/:studentId/user',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUser
        );
        this.router.get(
            '/:studentId/university',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversity
        );
        this.router.get(
            '/:studentId/program',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentProgram
        );
        this.router.get(
            '/:studentId/remaining-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentRemainingCourses
        );
        this.router.get(
            '/:studentId/schedules',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentSchedules
        );
        this.router.get(
            '/:studentId/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentCompletedCourses,
        );
        this.router.post(
            '/:studentId/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.addStudentCompletedCourses,
        );
        this.router.delete(
            '/:studentId/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.removeStudentCompletedCourses,
        );
    }
}
