import { ERRORS } from "../../../constants/error.constants";
import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import GenericException from "../../../exceptions/generic.exception";
import { getChildsFromParent, getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import Course from "../../abstract/course.model";
import Program from "../../abstract/program.model";
import University from "../../abstract/university.model";

export default class MemoryProgram extends Program {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async addCourse(courseId: string, optional: boolean): Promise<void> {
        const map = optional ? MEMORY_DATABASE.optionalCoursesOfProgram : MEMORY_DATABASE.mandatoryCoursesOfProgram;
        // We first check if we need to initialize array
        if (!map.get(this.id))
            map.set(this.id, new Set());
        
        // Now we update the map
        map.get(this.id)!.add(courseId);
    }

    public async getMandatoryCourses(): Promise<Course[]> {
        return getChildsFromParent<Course>(MEMORY_DATABASE.mandatoryCoursesOfProgram, MEMORY_DATABASE.courses, this.id);
    }

    public async getOptionalCourses(): Promise<Course[]> {
        return getChildsFromParent<Course>(MEMORY_DATABASE.optionalCoursesOfProgram, MEMORY_DATABASE.courses, this.id);
    }

    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(MEMORY_DATABASE.programsOfUniversity, MEMORY_DATABASE.universities, this.id);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }
}