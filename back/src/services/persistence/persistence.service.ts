import { ROLE } from "../../constants/general.constants";
import TimeRange from "../../helpers/classes/timeRange.class";
import Building from "../../models/abstract/building.model";
import Course from "../../models/abstract/course.model";
import CourseClass from "../../models/abstract/courseClass.model";
import Lecture from "../../models/abstract/lecture.model";
import Program from "../../models/abstract/program.model";
import Schedule from "../../models/abstract/schedule.model";
import Student from "../../models/abstract/student.model";
import Term from "../../models/abstract/term.model";
import University from "../../models/abstract/university.model";
import User from "../../models/abstract/user.model";

// This is the abstract class that defines how a persistence service should work
export default abstract class PersistenceService {

    /////////////////// Basic constructors ///////////////////
    // These methods creates a new entity in the database with the given info
    public abstract createUser(email: string, password: string, role: ROLE): Promise<User>;
    public abstract createUniversity(userId: string, name: string, verified: boolean): Promise<University>;
    public abstract createProgram(universityId: string, internalId: string, name: string): Promise<Program>;
    public abstract createBuilding(universityId: string, internalId: string, name: string): Promise<Building>;
    public abstract createTerm(universityId: string, internalId: string, name: string, published: boolean, startDate: Date): Promise<Term>;
    public abstract createCourse(universityId: string, internalId: string, name: string): Promise<Course>;
    public abstract createCourseClass(courseId: string, termId: string, name: string): Promise<CourseClass>;
    public abstract createLecture(courseClassId: string, buildingId: string, time: TimeRange): Promise<Lecture>;
    public abstract createStudent(userId: string, universityId: string, programId: string, internalId: string, name: string): Promise<Student>;
    public abstract createSchedule(studentId: string, termId: string, courseClassIds: string[]): Promise<Schedule>;
    
    /////////////////// Basic getters ///////////////////
    // These methods just retrieve the entity by the database id
    public abstract getUser(id: string): Promise<User>;
    public abstract getUniversity(id: string): Promise<University>;
    public abstract getProgram(id: string): Promise<Program>;
    public abstract getBuilding(id: string): Promise<Building>;
    public abstract getTerm(id: string): Promise<Term>;
    public abstract getCourse(id: string): Promise<Course>;
    public abstract getCourseClass(id: string): Promise<CourseClass>;
    public abstract getLecture(id: string): Promise<Lecture>;
    public abstract getStudent(id: string): Promise<Student>;
    public abstract getSchedule(id: string): Promise<Schedule>;

    /////////////////// Basic setters ///////////////////
    // These methods just update the properties of the entity in the database
    public abstract setUser(user: User): Promise<void>;
    public abstract setUniversity(university: University): Promise<void>;
    public abstract setProgram(program: Program): Promise<void>;
    public abstract setBuilding(building: Building): Promise<void>;
    public abstract setTerm(term: Term): Promise<void>;
    public abstract setCourse(course: Course): Promise<void>;
    public abstract setCourseClass(courseClass: CourseClass): Promise<void>;
    public abstract setLecture(lecture: Lecture): Promise<void>;
    public abstract setStudent(student: Student): Promise<void>;
    public abstract setSchedule(schedule: Schedule): Promise<void>;

    /////////////////// Other queries ///////////////////
    // TODO: add here any extra queries we want to add, i'll add one as an example
    public abstract getStudentByInternalId(universityId: string, internalId: string): Promise<Student>;
}