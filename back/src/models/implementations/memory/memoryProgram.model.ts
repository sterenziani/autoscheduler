import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    addChildToParent,
    getChildsFromParent,
    getParentFromChild,
    clearParentsChildren,
} from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../abstract/course.model';
import Program from '../../abstract/program.model';
import University from '../../abstract/university.model';

export default class MemoryProgram extends Program {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async addCourse(courseId: string, optional: boolean): Promise<void> {
        addChildToParent(
            optional ? MEMORY_DATABASE.optionalCoursesOfProgram : MEMORY_DATABASE.mandatoryCoursesOfProgram,
            this.id,
            courseId,
        );
    }

    public async setMandatoryCourses(mandatoryCourseIds: string[]): Promise<void> {
        clearParentsChildren(MEMORY_DATABASE.mandatoryCoursesOfProgram, this.id);
        await Promise.all([Promise.all(mandatoryCourseIds.map(async (cId) => await this.addCourse(cId, false)))]);
    }

    public async setOptionalCourses(optionalCourseIds: string[]): Promise<void> {
        clearParentsChildren(MEMORY_DATABASE.optionalCoursesOfProgram, this.id);
        await Promise.all([Promise.all(optionalCourseIds.map(async (cId) => await this.addCourse(cId, true)))]);
    }

    public async getMandatoryCourses(limit?: number, offset?: number): Promise<Course[]> {
        const courses = getChildsFromParent<Course>(
            MEMORY_DATABASE.mandatoryCoursesOfProgram,
            MEMORY_DATABASE.courses,
            this.id,
        );
        return courses;
    }

    public async getOptionalCourses(limit?: number, offset?: number): Promise<Course[]> {
        const courses = getChildsFromParent<Course>(
            MEMORY_DATABASE.optionalCoursesOfProgram,
            MEMORY_DATABASE.courses,
            this.id,
        );
        return courses;
    }

    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(
            MEMORY_DATABASE.programsOfUniversity,
            MEMORY_DATABASE.universities,
            this.id,
        );
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }
}
