import { ERRORS } from "../../../constants/error.constants";
import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import GenericException from "../../../exceptions/generic.exception";
import { getChildsFromParent, getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import CourseClass from "../../abstract/courseClass.model";
import Term from "../../abstract/term.model";
import University from "../../abstract/university.model";

export default class MemoryTerm extends Term {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getCourseClasses(): Promise<CourseClass[]> {
        return getChildsFromParent<CourseClass>(MEMORY_DATABASE.courseClassesOfTerm, MEMORY_DATABASE.courseClasses, this.id);
    }

    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(MEMORY_DATABASE.termsOfUniversity, MEMORY_DATABASE.universities, this.id);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }
}