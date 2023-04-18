import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import { getChildsFromParent } from "../../../helpers/persistence/memoryPersistence.helper";
import Building from "../../abstract/building.model";
import Course from "../../abstract/course.model";
import Program from "../../abstract/program.model";
import Student from "../../abstract/student.model";
import Term from "../../abstract/term.model";
import University from "../../abstract/university.model"

export default class MemoryUniversity extends University {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async getPrograms(): Promise<Program[]> {
        return getChildsFromParent<Program>(MEMORY_DATABASE.programsOfUniversity, MEMORY_DATABASE.programs, this.id);
    }

    public async getBuildings(): Promise<Building[]> {
        return getChildsFromParent<Building>(MEMORY_DATABASE.buildingsOfUniversity, MEMORY_DATABASE.buildings, this.id);
    }

    public async getCourses(): Promise<Course[]> {
        return getChildsFromParent<Course>(MEMORY_DATABASE.coursesOfUniversity, MEMORY_DATABASE.courses, this.id);
    }

    public async getTerms(): Promise<Term[]> {
        return getChildsFromParent<Term>(MEMORY_DATABASE.termsOfUniversity, MEMORY_DATABASE.terms, this.id);
    }

    public async getStudents(): Promise<Student[]> {
        return getChildsFromParent<Student>(MEMORY_DATABASE.studentsOfUniversity, MEMORY_DATABASE.students, this.id);
    }
}