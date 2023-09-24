import CourseDao from '../persistence/abstract/course.dao';

export default class CourseDaoFactory {
    // Static Getters
    public static get(): CourseDao {
        throw new Error('Not Implemented');
    }
}
