import { ERRORS } from '../../../constants/error.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import {
    addChildToParent,
    getChildsFromParent,
    getChildsFromParents,
    getParentFromChild,
} from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../abstract/course.model';
import Program from '../../abstract/program.model';
import Student from '../../abstract/student.model';
import University from '../../abstract/university.model';

export default class MemoryStudent extends Student {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(
            MEMORY_DATABASE.studentsOfUniversity,
            MEMORY_DATABASE.universities,
            this.id,
        );
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }

    public async getProgram(): Promise<Program | undefined> {
        try{
            const maybeProgram = getParentFromChild<Program>(
                MEMORY_DATABASE.studentsOfProgram,
                MEMORY_DATABASE.programs,
                this.id,
            );
            return maybeProgram;
        } catch(e) {
            return undefined;
        }
    }

    public async getCompletedCourses(): Promise<Course[]> {
        return getChildsFromParent<Course>(MEMORY_DATABASE.completedCoursesOfStudent, MEMORY_DATABASE.courses, this.id);
    }

    public async addCompletedCourse(courseId: string): Promise<void> {
        addChildToParent(MEMORY_DATABASE.completedCoursesOfStudent, this.id, courseId);
    }

    public async deleteCompletedCourse(courseId: string): Promise<void> {
        MEMORY_DATABASE.completedCoursesOfStudent.get(this.id)?.delete(courseId);
    }

    public async getRemainingCoursesProgram(programId: string): Promise<Course[]> {
        const completedCourses = await this.getCompletedCourses();
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
        const nonFinishedMandatoryCourses = mandatoryCourses.filter(item => !completedCourses.includes(item));
        const nonFinishedOptionalCourses = optionalCourses.filter(item => !completedCourses.includes(item));
        return [...nonFinishedMandatoryCourses, ...nonFinishedOptionalCourses];
    }

    public async getEnabledCourses(programId: string): Promise<Course[]> {
        const completedCourses = await this.getCompletedCourses();
        const nonFinishedCourses = await this.getRemainingCoursesProgram(programId);
        const enabledCourses = [];

        for(const c of nonFinishedCourses){
            const requirements = await c.getRequiredCoursesForProgram(programId);
            let enabled = true;
            for(const r of requirements){
                if(!completedCourses.find(f => f.id === r.id)) enabled = false;
            }
            if(enabled) enabledCourses.push(c);
        }
        return enabledCourses;
    }
}
