import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import { LectureController } from '../controllers/lecture.controller';
import adminOnlyMiddleware from '../middlewares/adminOnly.middleware';

export class LectureRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: LectureController = new LectureController();

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

        this.router.get('/', authUsersOnlyMiddleware, adminOnlyMiddleware ,this.controller.getLectures);
        this.router.get('/:lectureId', authUsersOnlyMiddleware, adminOnlyMiddleware, this.controller.getLecture);
    }
}
