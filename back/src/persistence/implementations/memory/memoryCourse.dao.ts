import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import {
    addChildToParent,
    getChildsFromParent,
    paginateCollection,
} from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../../models/abstract/course.model';
import MemoryCourse from '../../../models/implementations/memory/memoryCourse.model';
import CourseDao from '../../abstract/course.dao';
import MemoryUniversityDao from './memoryUniversity.dao';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedCollection } from '../../../interfaces/paging.interface';

export default class MemoryCourseDao extends CourseDao {
    private static instance: CourseDao;

    static getInstance = () => {
        if (!MemoryCourseDao.instance) {
            MemoryCourseDao.instance = new MemoryCourseDao();
        }
        return MemoryCourseDao.instance;
    };

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

    public async findByInternalId(universityId: string, internalId: string): Promise<Course | undefined> {
        const universityCourses = getChildsFromParent(
            MEMORY_DATABASE.coursesOfUniversity,
            MEMORY_DATABASE.courses,
            universityId,
        );
        return universityCourses.find((c) => c.internalId == internalId);
    }

    public async set(course: Course): Promise<void> {
        await this.getById(course.id);

        if (!(course instanceof MemoryCourse)) course = new MemoryCourse(course.id, course.internalId, course.name);

        MEMORY_DATABASE.courses.set(course.id, course);
    }

    public async getByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Course>> {
        text = text ? text.toLowerCase() : text;
        let courses: Course[] = getChildsFromParent(
            MEMORY_DATABASE.coursesOfUniversity,
            MEMORY_DATABASE.courses,
            universityId,
        );
        if (text) {
            courses = courses.filter(
                (c) => c.name.toLowerCase().includes(text!) || c.internalId.toLowerCase().includes(text!),
            );
        }

        // sorting by internalId
        const compareCourses = (c1: Course, c2: Course) => {
            if (c1.internalId < c2.internalId) return -1;
            if (c1.internalId > c2.internalId) return 1;
            return 0;
        };

        return paginateCollection(courses, compareCourses, limit, offset);
    }
}
