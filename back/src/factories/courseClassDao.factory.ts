import { PERSISTENCE } from "../constants/persistence/persistence.contants";
import CourseClassDao from "../persistence/abstract/courseClass.dao";
import MemoryCourseClassDao from "../persistence/implementations/memory/memoryCourseClass.dao";
import GenericDaoFactory from "./genericDao.factory";

export default class CourseClassDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): CourseClassDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryCourseClassDao.getInstance();
        }
    }
}