import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    addGrandchildToParent,
    getGrandchildsFromParent,
    getChildsFromParent,
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

    public async getIndirectCorrelatives(programId: string): Promise<Course[]> {
        const mandatoryCourses = getChildsFromParent<Course>(
            MEMORY_DATABASE.mandatoryCoursesOfProgram,
            MEMORY_DATABASE.courses,
            programId,
        );
        const optionalCourses = getChildsFromParent<Course>(
            MEMORY_DATABASE.optionalCoursesOfProgram,
            MEMORY_DATABASE.courses,
            programId,
        );
        const programCourses = [...mandatoryCourses, ...optionalCourses];

        // Create map where key is a course ID and values are the courses enabled immediately after completing the key.
        const unlocks: { [courseId: string]: Set<Course> } = {};
        for(const c of programCourses) unlocks[c.id] = new Set();
        for(const c of programCourses) {
            const requirements = await c.getRequiredCoursesForProgram(programId);
            requirements.forEach( r => unlocks[r.id].add(c) );
        };

        // Expand the map entry to also include the courses indirectly correlative to it.
        unlocks[this.id] = this.findIndirectCorrelativesRec(unlocks, this.id);
        return Array.from(unlocks[this.id]);
    }

    private findIndirectCorrelativesRec(unlocks: { [courseId: string]: Set<Course> }, courseId: string): Set<Course> {
        if (!unlocks[courseId]) return new Set();
        unlocks[courseId].forEach( u => {
            const unlockablesFromU = this.findIndirectCorrelativesRec(unlocks, u.id);
            unlocks[courseId] = new Set([...unlocks[courseId], ...unlockablesFromU]);
        });
        return unlocks[courseId];
    };

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
