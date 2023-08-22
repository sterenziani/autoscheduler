import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    addGrandchildToParent,
    getGrandchildsFromParent,
    getChildsFromParents,
    getMiddleChildsFromParent,
    getParentFromChild,
    clearParentsGrandchildren,
} from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../abstract/course.model';
import CourseClass from '../../abstract/courseClass.model';
import University from '../../abstract/university.model';
import Program from '../../abstract/program.model';

export default class MemoryCourse extends Course {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async setRequiredCourse(programId: string, courseId: string): Promise<void> {
        addGrandchildToParent(MEMORY_DATABASE.requiredCoursesOfCourse, this.id, programId, courseId);
    }

    public async setRequiredCourses(requiredCourses: { [programId: string]: string[] }): Promise<void> {
        clearParentsGrandchildren(MEMORY_DATABASE.requiredCoursesOfCourse, this.id);
        for (const programId of Object.keys(requiredCourses)) {
            for (const courseId of requiredCourses[programId]) {
                addGrandchildToParent(MEMORY_DATABASE.requiredCoursesOfCourse, this.id, programId, courseId);
            }
        }
    }

    public async getProgramsWithRequiredCourses(): Promise<Program[]> {
        const programs: Program[] = getMiddleChildsFromParent<Program>(
            MEMORY_DATABASE.requiredCoursesOfCourse,
            MEMORY_DATABASE.programs,
            this.id,
        );

        // sorting by internalId
        const comparePrograms = (p1: Program, p2: Program) => {
            if (p1.internalId < p2.internalId) return -1;
            if (p1.internalId > p2.internalId) return 1;
            return 0;
        };
        return programs.sort(comparePrograms);
    }

    public async getRequiredCoursesForProgram(programId: string): Promise<Course[]> {
        const courses: Course[] = getGrandchildsFromParent<Course>(
            MEMORY_DATABASE.requiredCoursesOfCourse,
            MEMORY_DATABASE.courses,
            this.id,
            programId,
        );

        // sorting by internalId
        const compareCourses = (c1: Course, c2: Course) => {
            if (c1.internalId < c2.internalId) return -1;
            if (c1.internalId > c2.internalId) return 1;
            return 0;
        };
        return courses.sort(compareCourses);
    }

    // I know this is inefficient but i don't see the point of making it better when memory database is just for testing
    public async getCourseClasses(termId: string): Promise<CourseClass[]> {
        return getChildsFromParents<CourseClass>(
            MEMORY_DATABASE.courseClassesOfCourse,
            MEMORY_DATABASE.courseClassesOfTerm,
            MEMORY_DATABASE.courseClasses,
            this.id,
            termId,
        );
    }

    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(
            MEMORY_DATABASE.coursesOfUniversity,
            MEMORY_DATABASE.universities,
            this.id,
        );
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }
}
