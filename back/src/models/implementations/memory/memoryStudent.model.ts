import { ERRORS } from "../../../constants/error.constants";
import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import GenericException from "../../../exceptions/generic.exception";
import { getChildsFromParent, getChildsFromParents, getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import Course from "../../abstract/course.model";
import Program from "../../abstract/program.model";
import Schedule from "../../abstract/schedule.model";
import Student from "../../abstract/student.model";
import University from "../../abstract/university.model";

export default class MemoryStudent extends Student {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(MEMORY_DATABASE.studentsOfUniversity, MEMORY_DATABASE.universities, this.id);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }

    public async getProgram(): Promise<Program> {
        const maybeProgram = getParentFromChild<Program>(MEMORY_DATABASE.studentsOfProgram, MEMORY_DATABASE.programs, this.id);
        if (!maybeProgram) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);
        return maybeProgram;
    }

    public async getCompletedCourses(): Promise<Course[]> {
        return getChildsFromParent<Course>(MEMORY_DATABASE.completedCoursesOfStudent, MEMORY_DATABASE.courses, this.id);
    }

    public async addCompletedCourse(courseId: string): Promise<void> {
        const map = MEMORY_DATABASE.completedCoursesOfStudent;
        // We first check if we need to initialize array
        if (!map.get(this.id))
            map.set(this.id, new Set());
        
        // Now we update the map
        map.get(this.id)!.add(courseId);
    }

    public async deleteCompletedCourse(courseId: string): Promise<void> {
        MEMORY_DATABASE.completedCoursesOfStudent.get(this.id)?.delete(courseId);
    }

    public async getSchedules(termId: string): Promise<Schedule[]> {
        return getChildsFromParents<Schedule>(MEMORY_DATABASE.schedulesOfStudent, MEMORY_DATABASE.schedulesOfTerm, MEMORY_DATABASE.schedules, this.id, termId);
    }
}