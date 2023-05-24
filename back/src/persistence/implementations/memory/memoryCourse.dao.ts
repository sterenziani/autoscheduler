import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { addChildToParent, paginateCollection } from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../../models/abstract/course.model';
import MemoryCourse from '../../../models/implementations/memory/memoryCourse.model';
import CourseDao from '../../abstract/course.dao';
import MemoryUniversityDao from './memoryUniversity.dao';
import { v4 as uuidv4 } from 'uuid';
import GenericException from '../../../exceptions/generic.exception';
import { ERRORS } from '../../../constants/error.constants';
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
        // find courses with matching internalId
        const coursesWithMatchingInternalId: Course[] = Array.from(MEMORY_DATABASE.courses.values()).filter(
            (c) => c.internalId == internalId,
        );
        // find university with matching obtained id
        for (const course of coursesWithMatchingInternalId) {
            const university = await course.getUniversity();
            if (university.id == universityId) return course;
        }
        return undefined;
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
        offset = 0,
    ): Promise<PaginatedCollection<Course>> {
        // limit must be either undefined or positive integer
        if (limit && (!Number.isInteger(limit) || limit <= 0))
            throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PAGING_PARAMS);
        // offset must be either undefined or integer
        if (offset && !Number.isInteger(offset)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_PAGING_PARAMS);

        text = text ? text.toLowerCase() : text;
        let courses = [];
        for (const course of MEMORY_DATABASE.courses.values()) {
            const university = await course.getUniversity();
            if (university.id != universityId) continue;
            if (!text || course.name.toLowerCase().includes(text) || course.internalId.toLowerCase().includes(text)) {
                courses.push(course);
            }
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
