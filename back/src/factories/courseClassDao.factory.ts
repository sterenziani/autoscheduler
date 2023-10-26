import CourseClassDao from '../persistence/abstract/courseClass.dao';
import DatabaseCourseClassDao from '../persistence/implementations/databaseCourseClass.dao';

export default class CourseClassDaoFactory {
    // Static Getters
    public static get(): CourseClassDao {
        return DatabaseCourseClassDao.getInstance();
    }
}
