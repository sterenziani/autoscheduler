import { ROLE } from "../../../../constants/general.constants";
import { v4 as uuidv4 } from "uuid";
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
import { MEMORY_DATABASE } from "../../../../constants/persistence/memoryPersistence.constants";
import MemoryUniversity from "../../../../models/implementations/memory/memoryUniversity.model";
import MemoryProgram from "../../../../models/implementations/memory/memoryProgram.model";
import { addChildToParent, getChildsFromParent } from "../../../../helpers/persistence/memoryPersistence.helper";
import MemoryBuilding from "../../../../models/implementations/memory/memoryBuilding.model";
import MemoryTerm from "../../../../models/implementations/memory/memoryTerm.model";
import MemoryCourse from "../../../../models/implementations/memory/memoryCourse.model";
import MemoryCourseClass from "../../../../models/implementations/memory/memoryCourseClass.model";
import MemoryLecture from "../../../../models/implementations/memory/memoryLecture.model";
import MemoryStudent from "../../../../models/implementations/memory/memoryStudent.model";
import MemorySchedule from "../../../../models/implementations/memory/memorySchedule.model";
import GenericException from "../../../../exceptions/generic.exception";
import { ERRORS } from "../../../../constants/error.constants";

export default class MemoryPersistence extends PersistenceService {

    /////////////////// Basic constructors ///////////////////
    // These methods creates a new entity in the database with the given info
    public async createUser(email: string, password: string, role: ROLE): Promise<User> {
        const newUser = new MemoryUser(uuidv4(), email, password, role);
        MEMORY_DATABASE.users.set(newUser.id, newUser);
        return newUser;
    }

    public async createUniversity(userId: string, name: string, verified: boolean): Promise<University> {
        // We get the user to check that it exists and to get the rest of the info
        const user = await this.getUser(userId);
        const newUniversity = new MemoryUniversity(user.id, user.email, user.password, name, verified);
        MEMORY_DATABASE.universities.set(newUniversity.id, newUniversity);
        return newUniversity;
    }

    public async createProgram(universityId: string, internalId: string, name: string): Promise<Program> {
        // We get the university to check that it exists
        const university = await this.getUniversity(universityId);
        const newProgram = new MemoryProgram(uuidv4(), internalId, name);
        
        // We need to save the program and the relationship with the university
        MEMORY_DATABASE.programs.set(newProgram.id, newProgram);
        addChildToParent(MEMORY_DATABASE.programsOfUniversity, university.id, newProgram.id);
        
        return newProgram;
    }

    public async createBuilding(universityId: string, internalId: string, name: string): Promise<Building> {
        // We get the university to check that it exists
        const university = await this.getUniversity(universityId);
        const newBuilding = new MemoryBuilding(uuidv4(), internalId, name);

        MEMORY_DATABASE.buildings.set(newBuilding.id, newBuilding);
        addChildToParent(MEMORY_DATABASE.buildingsOfUniversity, university.id, newBuilding.id);

        return newBuilding;
    }

    public async createTerm(universityId: string, internalId: string, name: string, published: boolean, startDate: Date): Promise<Term> {
        // We get the university to check that it exists
        const university = await this.getUniversity(universityId);
        const newTerm = new MemoryTerm(uuidv4(), internalId, name, published, startDate);

        MEMORY_DATABASE.terms.set(newTerm.id, newTerm);
        addChildToParent(MEMORY_DATABASE.termsOfUniversity, university.id, newTerm.id);

        return newTerm;
    }

    public async createCourse(universityId: string, internalId: string, name: string): Promise<Course> {
        // We get the university to check that it exists
        const university = await this.getUniversity(universityId);
        const newCourse = new MemoryCourse(uuidv4(), internalId, name);

        MEMORY_DATABASE.courses.set(newCourse.id, newCourse);
        addChildToParent(MEMORY_DATABASE.coursesOfUniversity, university.id, newCourse.id);

        return newCourse;
    }

    public async createCourseClass(courseId: string, termId: string, name: string): Promise<CourseClass> {
        // We get the course and term to check that they exist
        const course = await this.getCourse(courseId);
        const term = await this.getTerm(termId);
        const newCourseClass = new MemoryCourseClass(uuidv4(), name);

        MEMORY_DATABASE.courseClasses.set(newCourseClass.id, newCourseClass);
        addChildToParent(MEMORY_DATABASE.courseClassesOfCourse, course.id, newCourseClass.id);
        addChildToParent(MEMORY_DATABASE.courseClassesOfTerm, term.id, newCourseClass.id);

        return newCourseClass;
    }

    public async createLecture(courseClassId: string, buildingId: string, time: TimeRange): Promise<Lecture> {
        // We get the course class and the building to check that they exist
        const courseClass = await this.getCourseClass(courseClassId);
        const building = await this.getBuilding(buildingId);
        const newLecture = new MemoryLecture(uuidv4(), time);

        MEMORY_DATABASE.lectures.set(newLecture.id, newLecture);
        addChildToParent(MEMORY_DATABASE.lecturesOfCourseClass, courseClass.id, newLecture.id);
        addChildToParent(MEMORY_DATABASE.lecturesOfBuilding, building.id, newLecture.id);

        return newLecture;
    }

    public async createStudent(userId: string, universityId: string, programId: string, internalId: string, name: string): Promise<Student> {
        // We get user, university and program to check that they exist
        const user = await this.getUser(userId);
        const university = await this.getUniversity(universityId);
        const program = await this.getProgram(programId);
        const newStudent = new MemoryStudent(user.id, user.email, user.password, internalId, name);

        MEMORY_DATABASE.students.set(newStudent.id, newStudent);
        addChildToParent(MEMORY_DATABASE.studentsOfUniversity, university.id, newStudent.id);
        addChildToParent(MEMORY_DATABASE.studentsOfProgram, program.id, newStudent.id);

        return newStudent;
    }

    public async createSchedule(studentId: string, termId: string): Promise<Schedule> {
        // We get student and term to check that they exist
        const student = await this.getStudent(studentId);
        const term = await this.getTerm(termId);
        const newSchedule = new MemorySchedule(uuidv4());

        MEMORY_DATABASE.schedules.set(newSchedule.id, newSchedule);
        addChildToParent(MEMORY_DATABASE.schedulesOfStudent, student.id, newSchedule.id);
        addChildToParent(MEMORY_DATABASE.schedulesOfTerm, term.id, newSchedule.id);

        return newSchedule;
    }

    /////////////////// Basic getters ///////////////////
    // These methods just retrieve the entity by the database id
    public async getUser(id: string): Promise<User> {
        const maybeEntity = MEMORY_DATABASE.users.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.USER);
        return maybeEntity;
    }

    public async getUniversity(id: string): Promise<University> {
        const maybeEntity = MEMORY_DATABASE.universities.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeEntity;
    }

    public async getProgram(id: string): Promise<Program> {
        const maybeEntity = MEMORY_DATABASE.programs.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);
        return maybeEntity;
    }

    public async getBuilding(id: string): Promise<Building> {
        const maybeEntity = MEMORY_DATABASE.buildings.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
        return maybeEntity;
    }

    public async getTerm(id: string): Promise<Term> {
        const maybeEntity = MEMORY_DATABASE.terms.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.TERM);
        return maybeEntity;
    }

    public async getCourse(id: string): Promise<Course> {
        const maybeEntity = MEMORY_DATABASE.courses.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
        return maybeEntity;
    }

    public async getCourseClass(id: string): Promise<CourseClass> {
        const maybeEntity = MEMORY_DATABASE.courseClasses.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.COURSE_CLASS);
        return maybeEntity;
    }

    public async getLecture(id: string): Promise<Lecture> {
        const maybeEntity = MEMORY_DATABASE.lectures.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.LECTURE);
        return maybeEntity;
    }

    public async getStudent(id: string): Promise<Student> {
        const maybeEntity = MEMORY_DATABASE.students.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.STUDENT);
        return maybeEntity;
    }

    public async getSchedule(id: string): Promise<Schedule> {
        const maybeEntity = MEMORY_DATABASE.schedules.get(id);
        if (!maybeEntity) throw new GenericException(ERRORS.NOT_FOUND.SCHEDULE);
        return maybeEntity;
    }

    /////////////////// Basic setters ///////////////////
    // These methods just update the properties of the entity in the database, entity must already exist in database, otherwise it will throw, use create for creating
    public async setUser(user: User): Promise<void> {
        await this.getUser(user.id);

        if (!(user instanceof MemoryUser))
            user = new MemoryUser(user.id, user.email, user.password, user.role);
        
        MEMORY_DATABASE.users.set(user.id, user);
    }

    public async setUniversity(university: University): Promise<void> {
        await this.getUniversity(university.id);

        if (!(university instanceof MemoryUniversity))
            university = new MemoryUniversity(university.id, university.email, university.password, university.name, university.verified);
        
        MEMORY_DATABASE.universities.set(university.id, university);
    }

    public async setProgram(program: Program): Promise<void> {
        await this.getProgram(program.id);

        if (!(program instanceof MemoryProgram))
            program = new MemoryProgram(program.id, program.internalId, program.name);
        
        MEMORY_DATABASE.programs.set(program.id, program);
    }

    public async setBuilding(building: Building): Promise<void> {
        await this.getBuilding(building.id);

        if (!(building instanceof MemoryBuilding))
            building = new MemoryBuilding(building.id, building.internalId, building.name);

        MEMORY_DATABASE.buildings.set(building.id, building);
    }
    
    public async setTerm(term: Term): Promise<void> {
        await this.getTerm(term.id);

        if (!(term instanceof MemoryTerm))
            term = new MemoryTerm(term.id, term.internalId, term.name, term.published, term.startDate);
        
        MEMORY_DATABASE.terms.set(term.id, term);
    }

    public async setCourse(course: Course): Promise<void> {
        await this.getCourse(course.id);

        if (!(course instanceof MemoryCourse))
            course = new MemoryCourse(course.id, course.internalId, course.name);

        MEMORY_DATABASE.courses.set(course.id, course);
    }

    public async setCourseClass(courseClass: CourseClass): Promise<void> {
        await this.getCourseClass(courseClass.id);

        if (!(courseClass instanceof MemoryCourseClass))
            courseClass = new MemoryCourseClass(courseClass.id, courseClass.name);
        
        MEMORY_DATABASE.courseClasses.set(courseClass.id, courseClass);
    }

    public async setLecture(lecture: Lecture): Promise<void> {
        await this.getLecture(lecture.id);

        if (!(lecture instanceof MemoryLecture))
            lecture = new MemoryLecture(lecture.id, lecture.time);
        
        MEMORY_DATABASE.lectures.set(lecture.id, lecture);
    }

    public async setStudent(student: Student): Promise<void> {
        await this.getStudent(student.id);

        if (!(student instanceof MemoryStudent))
            student = new MemoryStudent(student.id, student.email, student.password, student.internalId, student.name);
        
        MEMORY_DATABASE.students.set(student.id, student);
    }

    public async setSchedule(schedule: Schedule): Promise<void> {
        await this.getSchedule(schedule.id);

        if (!(schedule instanceof MemorySchedule))
            schedule = new MemorySchedule(schedule.id);
        
        MEMORY_DATABASE.schedules.set(schedule.id, schedule);
    }
    
    /////////////////// Other queries ///////////////////
    // TODO: add here any extra queries we want to add, i'll add one as an example
    public async getStudentByInternalId(universityId: string, internalId: string): Promise<Student> {
        const studentsOfUniversity = getChildsFromParent(MEMORY_DATABASE.studentsOfUniversity, MEMORY_DATABASE.students, universityId);
        const maybeStudent = studentsOfUniversity.find(s => s.internalId == internalId);
        if (!maybeStudent) throw new GenericException(ERRORS.NOT_FOUND.STUDENT);
        return maybeStudent;
    }
}