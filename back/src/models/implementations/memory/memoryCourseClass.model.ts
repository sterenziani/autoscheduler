import { ERRORS } from "../../../constants/error.constants";
import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import GenericException from "../../../exceptions/generic.exception";
import { getChildsFromParent, getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import Course from "../../abstract/course.model";
import CourseClass from "../../abstract/courseClass.model"
import Lecture from "../../abstract/lecture.model";
import Term from "../../abstract/term.model";

export default class MemoryCourseClass extends CourseClass {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getTerm(): Promise<Term> {
        const maybeTerm = getParentFromChild<Term>(MEMORY_DATABASE.courseClassesOfTerm, MEMORY_DATABASE.terms, this.id);
        if (!maybeTerm) throw new GenericException(ERRORS.NOT_FOUND.TERM);
        return maybeTerm;
    }

    public async getLectures(): Promise<Lecture[]> {
        return getChildsFromParent<Lecture>(MEMORY_DATABASE.lecturesOfCourseClass, MEMORY_DATABASE.lectures, this.id);
    }

    public async getCourse(): Promise<Course> {
        const maybeCourse = getParentFromChild<Course>(MEMORY_DATABASE.courseClassesOfCourse, MEMORY_DATABASE.courses, this.id);
        if (!maybeCourse) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
        return maybeCourse;
    }
}