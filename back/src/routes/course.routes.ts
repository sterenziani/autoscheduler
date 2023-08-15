import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { CourseController } from '../controllers/course.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';

export class CourseRoutes {
    public router: Router = Router();
    public controller: CourseController = new CourseController();

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

        this.router.get('/:courseId', authUsersOnlyMiddleware, this.controller.getCourse);
        this.router.get('/:courseId/requirements/', authUsersOnlyMiddleware, this.controller.getProgramsWithCourseRequirements);
        this.router.get('/:courseId/requirements/:programId', authUsersOnlyMiddleware, this.controller.getCourseRequirementsForProgram);
        this.router.post('/', authUsersOnlyMiddleware, universitiesOnlyMiddleware, this.controller.createCourse);
        this.router.get('/:courseId', authUsersOnlyMiddleware, this.controller.getCourse);
    }
}
