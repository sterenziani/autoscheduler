import { ERRORS } from "../../../constants/error.constants";
import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import GenericException from "../../../exceptions/generic.exception";
import TimeRange from "../../../helpers/classes/timeRange.class";
import { getChildsFromParent, getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import CourseClass from "../../abstract/courseClass.model";
import Schedule from "../../abstract/schedule.model";
import Student from "../../abstract/student.model";
import Term from "../../abstract/term.model";

export default class MemorySchedule extends Schedule {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getStudent(): Promise<Student> {
        const maybeStudent = getParentFromChild<Student>(MEMORY_DATABASE.schedulesOfStudent, MEMORY_DATABASE.students, this.id);
        if (!maybeStudent) throw new GenericException(ERRORS.NOT_FOUND.STUDENT);
        return maybeStudent;
    }

    public async getTerm(): Promise<Term> {
        const maybeTerm = getParentFromChild<Term>(MEMORY_DATABASE.schedulesOfTerm, MEMORY_DATABASE.terms, this.id);
        if (!maybeTerm) throw new GenericException(ERRORS.NOT_FOUND.TERM);
        return maybeTerm;
    }

    public async addCourseClass(courseClassId: string): Promise<void> {
        const map = MEMORY_DATABASE.courseClassesOfSchedule;
        // We first check if we need to initialize array
        if (!map.get(this.id))
            map.set(this.id, new Set());
        
        // Now we update the map
        map.get(this.id)!.add(courseClassId);
    }

    public async getCourseClasses(): Promise<CourseClass[]> {
        return getChildsFromParent<CourseClass>(MEMORY_DATABASE.courseClassesOfSchedule, MEMORY_DATABASE.courseClasses, this.id);
    }

    public async getScore(credits: number, availableTimes: TimeRange[], reduceDays: boolean, prioritizeCourseRequirements: boolean): Promise<number> {
        throw new Error("Method not implemented.");
    }
}