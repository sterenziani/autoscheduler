import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { addChildToParent, getChildsFromParent, removeChildFromParent } from '../../../helpers/persistence/memoryPersistence.helper';
import { paginateCollection } from '../../../helpers/collection.helper';
import Building from '../../../models/abstract/building.model';
import CourseClass from '../../../models/abstract/courseClass.model';
import Course from '../../../models/abstract/course.model';
import Lecture from '../../../models/abstract/lecture.model';
import Term from '../../../models/abstract/term.model';
import University from '../../../models/abstract/university.model';
import MemoryCourseClass from '../../../models/implementations/memory/memoryCourseClass.model';
import CourseClassDao from '../../abstract/courseClass.dao';
import { v4 as uuidv4 } from 'uuid';
import MemoryCourseDao from './memoryCourse.dao';
import MemoryTermDao from './memoryTerm.dao';
import { PaginatedCollection } from '../../../interfaces/paging.interface';

export default class MemoryCourseClassDao extends CourseClassDao {
    private static instance: CourseClassDao;

    static getInstance = () => {
        if (!MemoryCourseClassDao.instance) {
            MemoryCourseClassDao.instance = new MemoryCourseClassDao();
        }
        return MemoryCourseClassDao.instance;
    };

    // Abstract Methods Implementations
    public async create(courseId: string, termId: string, name: string): Promise<CourseClass> {
        // We get the course and term to check that they exist
        const course = await MemoryCourseDao.getInstance().getById(courseId);
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

    public async findByCourseId(
        courseId: string,
        termId?: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<CourseClass>> {
        text = text ? text.toLowerCase() : text;
        let courseCourseClasses = getChildsFromParent(
            MEMORY_DATABASE.courseClassesOfCourse,
            MEMORY_DATABASE.courseClasses,
            courseId,
        );
        if (termId) {
            courseCourseClasses = (
                await Promise.all(
                    courseCourseClasses.map(async (cc) => {
                        return {
                            courseClass: cc,
                            term: await cc.getTerm(),
                        };
                    }),
                )
            )
                .filter((ccwt) => ccwt.term.id === termId)
                .map((ccwt) => ccwt.courseClass);
        }
        if (text) {
            courseCourseClasses = courseCourseClasses.filter((cc) => cc.name.toLowerCase().includes(text!));
        }

        // sorting by name, then id
        const compareCourseClasses = (c1: CourseClass, c2: CourseClass) => {
            if (c1.name < c2.name) return -1;
            if (c1.name > c2.name) return 1;

            if (c1.id < c2.id) return -1;
            if (c1.id > c2.id) return 1;
            return 0;
        };

        return paginateCollection(courseCourseClasses, compareCourseClasses, limit, offset);
    }

    public async findAllByTermId(
        termId: string,
        text?: string,
    ): Promise<CourseClass[]> {
        text = text ? text.toLowerCase() : text;
        let termCourseClasses = getChildsFromParent(
            MEMORY_DATABASE.courseClassesOfTerm,
            MEMORY_DATABASE.courseClasses,
            termId,
        );

        if (text) {
            termCourseClasses = termCourseClasses.filter((cc) => cc.name.toLowerCase().includes(text!));
        }

        // sorting by name, then id
        const compareCourseClasses = (c1: CourseClass, c2: CourseClass) => {
            if (c1.name < c2.name) return -1;
            if (c1.name > c2.name) return 1;

            if (c1.id < c2.id) return -1;
            if (c1.id > c2.id) return 1;
            return 0;
        };
        return termCourseClasses.sort(compareCourseClasses);
    }

    public async set(courseClass: CourseClass): Promise<void> {
        await this.getById(courseClass.id);

        if (!(courseClass instanceof MemoryCourseClass))
            courseClass = new MemoryCourseClass(courseClass.id, courseClass.name);

        MEMORY_DATABASE.courseClasses.set(courseClass.id, courseClass);
    }

    public async delete(courseClassId: string): Promise<void> {
        const courseClass = await this.getById(courseClassId);
        const lectures: Lecture[] = await courseClass.getLectures();
        const course: Course = await courseClass.getCourse();
        const term: Term = await courseClass.getTerm();
        const university: University = await course.getUniversity();

        // Delete lectures and references to them
        for(const l of lectures){
            const building: Building|undefined = await l.getBuilding();
            removeChildFromParent(MEMORY_DATABASE.lecturesOfCourseClass, courseClass.id, l.id);
            if(building) removeChildFromParent(MEMORY_DATABASE.lecturesOfBuilding, building.id, l.id);
            MEMORY_DATABASE.lectures.delete(l.id);
        }

        // Delete courseClass and references to it
        removeChildFromParent(MEMORY_DATABASE.courseClassesOfCourse, course.id, courseClass.id);
        removeChildFromParent(MEMORY_DATABASE.courseClassesOfTerm, term.id, courseClass.id);
        MEMORY_DATABASE.courseClasses.delete(courseClassId);
    }
}
