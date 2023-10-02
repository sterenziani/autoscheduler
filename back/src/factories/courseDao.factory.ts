import CourseDao from '../persistence/abstract/course.dao';
import DatabaseCourseDao from '../persistence/implementations/databaseCourse.dao';

export default class CourseDaoFactory {
    // Static Getters
    public static get(): CourseDao {
        return DatabaseCourseDao.getInstance();
    }
}
