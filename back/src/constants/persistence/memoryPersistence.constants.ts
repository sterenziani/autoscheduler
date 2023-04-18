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
    programsOfUniversity: Map<string, Set<string>>;             // universityId -> Set<programId>
    buildingsOfUniversity: Map<string, Set<string>>;            // universityId -> Set<buildingId>
    termsOfUniversity: Map<string, Set<string>>;                // universityId -> Set<termId>
    coursesOfUniversity: Map<string, Set<string>>;              // universityId -> Set<courseId>
    courseClassesOfCourse: Map<string, Set<string>>;            // courseId -> Set<courseClassId>
    courseClassesOfTerm: Map<string, Set<string>>;              // termId -> Set<courseClassId>
    lecturesOfCourseClass: Map<string, Set<string>>;            // courseClassId -> Set<lectureId>
    lecturesOfBuilding: Map<string, Set<string>>;               // buildingId -> Set<lectureId>
    studentsOfUniversity: Map<string, Set<string>>;             // universityId -> Set<studentId>
    studentsOfProgram: Map<string, Set<string>>;                // programId -> Set<studentId>
    schedulesOfStudent: Map<string, Set<string>>;               // studentId -> Set<scheduleId>
    schedulesOfTerm: Map<string, Set<string>>;                  // termId -> Set<scheduleId>
    courseClassesOfSchedule: Map<string, Set<string>>;          // scheduleId -> Set<courseClassId>

    // Course belongs to program relationship (Separate from others because it also has if it's optional or not)
    optionalCoursesOfProgram: Map<string, Set<string>>;         // programId -> Set<courseId>
    mandatoryCoursesOfProgram: Map<string, Set<string>>;        // programId -> Set<courseId>

    // Completed courses for student
    completedCoursesOfStudent: Map<string, Set<string>>;        // studentId -> Set<courseId>

    // Distance between buildings relationship
    distanceBetweenBuildings: Map<string, Map<string, number>>; // buildingId -> Map<buildingId, distance>

    // Required courses of course relationship
    requiredCoursesOfCourse: Map<string, Set<string>>;          // courseId -> Set<courseId>
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

    optionalCoursesOfProgram: new Map(),
    mandatoryCoursesOfProgram: new Map(),

    completedCoursesOfStudent: new Map(),

    distanceBetweenBuildings: new Map(),

    requiredCoursesOfCourse: new Map(),
};