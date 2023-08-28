import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import { CourseClassController } from '../controllers/courseClass.controller';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';

export class CourseClassRoutes {
    public router: Router = Router();
    public controller: CourseClassController = new CourseClassController();

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

        this.router.post('/', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.createCourseClass);
        this.router.put('/:courseClassId', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.updateCourseClass);
        this.router.get('/:courseClassId', this.controller.getCourseClass);
        this.router.get('/:courseClassId/lectures', this.controller.getLectures);
    }
}
