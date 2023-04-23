import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import { addChildToParent } from "../../../helpers/persistence/memoryPersistence.helper";
import CourseClass from "../../../models/abstract/courseClass.model";
import MemoryCourseClass from "../../../models/implementations/memory/memoryCourseClass.model";
import CourseClassDao from "../../abstract/courseClass.dao";
import {v4 as uuidv4} from "uuid";
import MemoryTermDao from "./memoryTerm.dao";

export default class MemoryCourseClassDao extends CourseClassDao {
    private static instance: CourseClassDao;

    static getInstance = () => {
        if (!MemoryCourseClassDao.instance) {
            MemoryCourseClassDao.instance = new MemoryCourseClassDao();
        }
        return MemoryCourseClassDao.instance;
    }

    // Abstract Methods Implementations
    public async create(courseId: string, termId: string, name: string): Promise<CourseClass> {
        // We get the course and term to check that they exist
        const course = await MemoryCourseClassDao.getInstance().getById(courseId);
        const term = await MemoryTermDao.getInstance().getById(termId);
        const newCourseClass = new MemoryCourseClass(uuidv4(), name);

        MEMORY_DATABASE.courseClasses.set(newCourseClass.id, newCourseClass);
        addChildToParent(MEMORY_DATABASE.courseClassesOfCourse, course.id, newCourseClass.id);
        addChildToParent(MEMORY_DATABASE.courseClassesOfTerm, term.id, newCourseClass.id);

        return newCourseClass;
    }

    public async findById(id: string): Promise<CourseClass | undefined> {
        return MEMORY_DATABASE.courseClasses.get(id);
    }

    public async set(courseClass: CourseClass): Promise<void> {
        await this.getById(courseClass.id);

        if (!(courseClass instanceof MemoryCourseClass))
            courseClass = new MemoryCourseClass(courseClass.id, courseClass.name);
        
        MEMORY_DATABASE.courseClasses.set(courseClass.id, courseClass);
    }
}