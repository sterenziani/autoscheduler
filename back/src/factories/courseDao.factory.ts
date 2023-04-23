import { PERSISTENCE } from "../constants/persistence/persistence.contants";
import CourseDao from "../persistence/abstract/course.dao";
import MemoryCourseDao from "../persistence/implementations/memory/memoryCourse.dao";
import GenericDaoFactory from "./genericDao.factory";

export default class CourseDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): CourseDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryCourseDao.getInstance();
        }
    }
}