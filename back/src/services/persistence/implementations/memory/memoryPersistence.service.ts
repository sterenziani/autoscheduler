import { ROLE } from "../../../../constants/general.constants";
import TimeRange from "../../../../helpers/classes/timeRange.class";
import Building from "../../../../models/abstract/building.model";
import Course from "../../../../models/abstract/course.model";
import CourseClass from "../../../../models/abstract/courseClass.model";
import Lecture from "../../../../models/abstract/lecture.model";
import Program from "../../../../models/abstract/program.model";
import Schedule from "../../../../models/abstract/schedule.model";
import Student from "../../../../models/abstract/student.model";
import Term from "../../../../models/abstract/term.model";
import University from "../../../../models/abstract/university.model";
import User from "../../../../models/abstract/user.model";
import MemoryUser from "../../../../models/implementations/memory/memoryUser.model";
import PersistenceService from "../../persistence.service";

export default class MemoryPersistence extends PersistenceService {

    private users: Map<string, MemoryUser> = new Map();
    private universities: Map<string, MemoryUniversity> = new Map();
    private programs: Map<string, MemoryProgram> = new Map();
    private buildings: Map<string, MemoryBuilding> = new Map();

    /////////////////// Basic constructors ///////////////////
    // These methods creates a new entity in the database with the given info
    public createUser(email: string, password: string, role: ROLE): Promise<User> {
        return
    }
    public createUniversity(userId: string, name: string, verified: boolean): Promise<University> {
        throw new Error("Method not implemented.");
    }
    public createProgram(universityId: string, internalId: string, name: string): Promise<Program> {
        throw new Error("Method not implemented.");
    }
    public createBuilding(universityId: string, internalId: string, name: string): Promise<Building> {
        throw new Error("Method not implemented.");
    }
    public createTerm(universityId: string, internalId: string, name: string, published: boolean, startDate: Date): Promise<Term> {
        throw new Error("Method not implemented.");
    }
    public createCourse(universityId: string, internalId: string, name: string): Promise<Course> {
        throw new Error("Method not implemented.");
    }
    public createCourseClass(courseId: string, termId: string, name: string): Promise<CourseClass> {
        throw new Error("Method not implemented.");
    }
    public createLecture(courseClassId: string, buildingId: string, time: TimeRange): Promise<Lecture> {
        throw new Error("Method not implemented.");
    }
    public createStudent(userId: string, universityId: string, programId: string, internalId: string, name: string): Promise<Student> {
        throw new Error("Method not implemented.");
    }
    public createSchedule(studentId: string, termId: string, courseClassIds: string[]): Promise<Schedule> {
        throw new Error("Method not implemented.");
    }

    /////////////////// Basic getters ///////////////////
    // These methods just retrieve the entity by the database id
    public getUser(id: string): Promise<User> {
        throw new Error("Method not implemented.");
    }
    public getUniversity(id: string): Promise<University> {
        throw new Error("Method not implemented.");
    }
    public getProgram(id: string): Promise<Program> {
        throw new Error("Method not implemented.");
    }
    public getBuilding(id: string): Promise<Building> {
        throw new Error("Method not implemented.");
    }
    public getTerm(id: string): Promise<Term> {
        throw new Error("Method not implemented.");
    }
    public getCourse(id: string): Promise<Course> {
        throw new Error("Method not implemented.");
    }
    public getCourseClass(id: string): Promise<CourseClass> {
        throw new Error("Method not implemented.");
    }
    public getLecture(id: string): Promise<Lecture> {
        throw new Error("Method not implemented.");
    }
    public getStudent(id: string): Promise<Student> {
        throw new Error("Method not implemented.");
    }
    public getSchedule(id: string): Promise<Schedule> {
        throw new Error("Method not implemented.");
    }

    /////////////////// Basic setters ///////////////////
    // These methods just update the properties of the entity in the database
    public setUser(user: User): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setUniversity(university: University): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setProgram(program: Program): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setBuilding(building: Building): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setTerm(term: Term): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setCourse(course: Course): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setCourseClass(courseClass: CourseClass): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setLecture(lecture: Lecture): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setStudent(student: Student): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public setSchedule(schedule: Schedule): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    /////////////////// Other queries ///////////////////
    // TODO: add here any extra queries we want to add, i'll add one as an example
    public getStudentByInternalId(universityId: string, internalId: string): Promise<Student> {
        throw new Error("Method not implemented.");
    }
}