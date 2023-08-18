import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    addChildToParent,
    getChildsFromParent,
    getParentFromChild,
    clearParentsChildren,
    paginateCollection,
} from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../abstract/course.model';
import Program from '../../abstract/program.model';
import University from '../../abstract/university.model';
import { PaginatedCollection } from '../../../interfaces/paging.interface';

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
        await Promise.all([
            Promise.all(mandatoryCourseIds.map(async (cId) => await this.addCourse(cId, false))),
        ]);
    }

    public async setOptionalCourses(optionalCourseIds: string[]): Promise<void> {
        clearParentsChildren(MEMORY_DATABASE.optionalCoursesOfProgram, this.id);
        await Promise.all([
            Promise.all(optionalCourseIds.map(async (cId) => await this.addCourse(cId, true))),
        ]);
    }

    public async getMandatoryCourses(limit?: number, offset?: number): Promise<PaginatedCollection<Course>> {
        const courses = getChildsFromParent<Course>(
            MEMORY_DATABASE.mandatoryCoursesOfProgram,
            MEMORY_DATABASE.courses,
            this.id,
        );

        // sorting by internalId
        const compareCourses = (c1: Course, c2: Course) => {
            if (c1.internalId < c2.internalId) return -1;
            if (c1.internalId > c2.internalId) return 1;
            return 0;
        };

        return paginateCollection(courses, compareCourses, limit, offset);
    }

    public async getOptionalCourses(limit?: number, offset?: number): Promise<PaginatedCollection<Course>> {
        const courses = getChildsFromParent<Course>(
            MEMORY_DATABASE.optionalCoursesOfProgram,
            MEMORY_DATABASE.courses,
            this.id,
        );

        // sorting by internalId
        const compareCourses = (c1: Course, c2: Course) => {
            if (c1.internalId < c2.internalId) return -1;
            if (c1.internalId > c2.internalId) return 1;
            return 0;
        };

        return paginateCollection(courses, compareCourses, limit, offset);
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
