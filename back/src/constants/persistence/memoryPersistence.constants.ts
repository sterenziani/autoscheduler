import Building from "../../models/abstract/building.model";
import Course from "../../models/abstract/course.model";
import CourseClass from "../../models/abstract/courseClass.model";
import Lecture from "../../models/abstract/lecture.model";
import Program from "../../models/abstract/program.model";
import Schedule from "../../models/abstract/schedule.model";
import Student from "../../models/abstract/student.model";
import Term from "../../models/abstract/term.model";
import University from "../../models/abstract/university.model";
import User from "../../models/abstract/user.model"

// This is very insecure, but this is just for testing so it's fine. This constants will act as the "Memory database" we "query"
interface IMemoryDatabase {
    // Basic entities
    users: Map<string, User>;
    universities: Map<string, University>;
    programs: Map<string, Program>;
    buildings: Map<string, Building>;
    terms: Map<string, Term>;
    courses: Map<string, Course>;
    courseClasses: Map<string, CourseClass>;
    lectures: Map<string, Lecture>;
    students: Map<string, Student>;
    schedules: Map<string, Schedule>;

    // Belongs to relationships
    programsOfUniversity: Map<string, string[]>;    // universityId -> programId[]
    buildingsOfUniversity: Map<string, string[]>;   // universityId -> buildingId[]
    termsOfUniversity: Map<string, string[]>;       // universityId -> termId[]
    coursesOfUniversity: Map<string, string[]>;     // universityId -> courseId[]
    courseClassesOfCourse: Map<string, string[]>;   // courseId -> courseClassId[]
    courseClassesOfTerm: Map<string, string[]>;     // termId -> courseClassId[]
    lecturesOfCourseClass: Map<string, string[]>;   // courseClassId -> lectureId[]
    lecturesOfBuilding: Map<string, string[]>;      // buildingId -> lectureId[]
    studentsOfUniversity: Map<string, string[]>;    // universityId -> studentId[]
    studentsOfProgram: Map<string, string[]>;       // programId -> studentId[]
    schedulesOfStudent: Map<string, string[]>;      // studentId -> scheduleId[]
    schedulesOfTerm: Map<string, string[]>;         // termId -> scheduleId[]
    courseClassesOfSchedule: Map<string, string[]>; // scheduleId -> courseClassId[]

    // Distance between buildings relationship
    distanceBetweenBuildings: Map<string, Map<string, number>>; // buildingId -> (map of buldingId -> distance)

    // Required courses of course relationship
    requiredCoursesOfCourse: Map<string, string[]>; // courseId -> courseId[]
}

export const MEMORY_DATABASE: IMemoryDatabase = {
    users: new Map(),
    universities: new Map(),
    programs: new Map(),
    buildings: new Map(),
    terms: new Map(),
    courses: new Map(),
    courseClasses: new Map(),
    lectures: new Map(),
    students: new Map(),
    schedules: new Map(),

    programsOfUniversity: new Map(),
    buildingsOfUniversity: new Map(),
    termsOfUniversity: new Map(),
    coursesOfUniversity: new Map(),
    courseClassesOfCourse: new Map(),
    courseClassesOfTerm: new Map(),
    lecturesOfCourseClass: new Map(),
    lecturesOfBuilding: new Map(),
    studentsOfUniversity: new Map(),
    studentsOfProgram: new Map(),
    schedulesOfStudent: new Map(),
    schedulesOfTerm: new Map(),
    courseClassesOfSchedule: new Map(),

    distanceBetweenBuildings: new Map(),

    requiredCoursesOfCourse: new Map(),
};