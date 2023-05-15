import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import { getParentFromChild } from '../../../helpers/persistence/memoryPersistence.helper';
import Building from '../../abstract/building.model';
import CourseClass from '../../abstract/courseClass.model';
import Lecture from '../../abstract/lecture.model';

export default class MemoryLecture extends Lecture {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async getBuilding(): Promise<Building> {
        const maybeBuilding = getParentFromChild<Building>(
            MEMORY_DATABASE.lecturesOfBuilding,
            MEMORY_DATABASE.buildings,
            this.id,
        );
        if (!maybeBuilding) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
        return maybeBuilding;
    }

    public async getCourseClass(): Promise<CourseClass> {
        const maybeCourseClass = getParentFromChild<CourseClass>(
            MEMORY_DATABASE.lecturesOfCourseClass,
            MEMORY_DATABASE.courseClasses,
            this.id,
        );
        if (!maybeCourseClass) throw new GenericException(ERRORS.NOT_FOUND.COURSE_CLASS);
        return maybeCourseClass;
    }
}
