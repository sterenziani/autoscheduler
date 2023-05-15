import CourseDaoFactory from '../factories/courseDao.factory';
import CourseDao from '../persistence/abstract/course.dao';

export default class CourseService {
    private static instance: CourseService;

    private dao: CourseDao;

    constructor() {
        this.dao = CourseDaoFactory.get();
    }

    static getInstance = (): CourseService => {
        if (!CourseService.instance) {
            CourseService.instance = new CourseService();
        }
        return CourseService.instance;
    };

    // public methods
}
