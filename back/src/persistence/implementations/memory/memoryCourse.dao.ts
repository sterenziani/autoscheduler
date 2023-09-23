import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import {
    addChildToParent,
    getChildsFromParent,
    removeChildFromParent,
    removeGrandchildFromParent,
} from '../../../helpers/persistence/memoryPersistence.helper';
import { paginateCollection } from '../../../helpers/collection.helper';
import { removeSpecialCharacters } from '../../../helpers/string.helper';
import Course from '../../../models/abstract/course.model';
import Program from '../../../models/abstract/program.model';
import Student from '../../../models/abstract/student.model';
import University from '../../../models/abstract/university.model';
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
    public async init(): Promise<void> {
        return;
    }
    
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
                (c) => removeSpecialCharacters(c.name).toLowerCase().includes(removeSpecialCharacters(text)!) || c.internalId.toLowerCase().includes(text!),
            );
        }

        const compareCourses = ((c1: Course, c2: Course) => c1.internalId.localeCompare(c2.internalId));
        return paginateCollection(courses, compareCourses, limit, offset);
    }

    public async delete(courseId: string): Promise<void> {
        const course: Course = await this.getById(courseId);
        const university: University = await course.getUniversity();
        const programs: Program[] = await university.getPrograms();
        const courses: Course[] = await university.getCourses();
        const students: Student[] = await university.getStudents();

        for(const p of programs) {
            // Remove course from program
            removeChildFromParent(MEMORY_DATABASE.mandatoryCoursesOfProgram, p.id, courseId);
            removeChildFromParent(MEMORY_DATABASE.optionalCoursesOfProgram, p.id, courseId);

            // Remove from course requirements under this program
            for(const c of courses) {
                if(c.id != courseId) removeGrandchildFromParent(MEMORY_DATABASE.requiredCoursesOfCourse, c.id, p.id, courseId);
            }
        }

        // Remove from student logs
        for(const student of students) {
            MEMORY_DATABASE.completedCoursesOfStudent.get(student.id)?.delete(courseId);
        }

        // Remove references to course
        removeChildFromParent(MEMORY_DATABASE.coursesOfUniversity, university.id, courseId);
        MEMORY_DATABASE.requiredCoursesOfCourse.delete(courseId);
        MEMORY_DATABASE.courses.delete(courseId);
    }
}
