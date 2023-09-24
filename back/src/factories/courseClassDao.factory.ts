import CourseClassDao from '../persistence/abstract/courseClass.dao';

export default class CourseClassDaoFactory {
    // Static Getters
    public static get(): CourseClassDao {
        throw new Error('Not Implemented');
    }
}
