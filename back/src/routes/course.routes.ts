import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { CourseController } from '../controllers/course.controller';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/userAuth.middleware';
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

        this.router.post('/', userAuthMiddleware, universitiesOnlyMiddleware, this.controller.createCourse);
        this.router.get('/:courseId', userAuthMiddleware, this.controller.getCourse);
    }
}
