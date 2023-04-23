import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import { addChildToParent } from "../../../helpers/persistence/memoryPersistence.helper";
import Course from "../../../models/abstract/course.model";
import MemoryCourse from "../../../models/implementations/memory/memoryCourse.model";
import CourseDao from "../../abstract/course.dao";
import MemoryUniversityDao from "./memoryUniversity.dao";
import {v4 as uuidv4} from "uuid";

export default class MemoryCourseDao extends CourseDao {
    private static instance: CourseDao;

    static getInstance = () => {
        if (!MemoryCourseDao.instance) {
            MemoryCourseDao.instance = new MemoryCourseDao();
        }
        return MemoryCourseDao.instance;
    }

    // Abstract Methods Implementations
    public async create(universityId: string, internalId: string, name: string): Promise<Course> {
        // We get the university to check that it exists
        const university = await MemoryUniversityDao.getInstance().getById(universityId);
        const newCourse = new MemoryCourse(uuidv4(), internalId, name);

        MEMORY_DATABASE.courses.set(newCourse.id, newCourse);
        addChildToParent(MEMORY_DATABASE.coursesOfUniversity, university.id, newCourse.id);

        return newCourse;
    }

    public async findById(id: string): Promise<Course | undefined> {
        return MEMORY_DATABASE.courses.get(id);
    }

    public async set(course: Course): Promise<void> {
        await this.getById(course.id);

        if (!(course instanceof MemoryCourse))
            course = new MemoryCourse(course.id, course.internalId, course.name);

        MEMORY_DATABASE.courses.set(course.id, course);
    }
}