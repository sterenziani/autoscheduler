import { ERRORS } from '../../../constants/error.constants';
import { DAY } from '../../../constants/time.constants';
import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import GenericException from '../../../exceptions/generic.exception';
import { getChildsFromParent, getParentFromChild, addChildToParent, removeChildFromParent } from '../../../helpers/persistence/memoryPersistence.helper';
import Course from '../../abstract/course.model';
import CourseClass from '../../abstract/courseClass.model';
import Lecture from '../../abstract/lecture.model';
import Term from '../../abstract/term.model';

export default class MemoryCourseClass extends CourseClass {
    /////////////////// Abstract Methods Implementation ///////////////////
    public async getTerm(): Promise<Term> {
        const maybeTerm = getParentFromChild<Term>(MEMORY_DATABASE.courseClassesOfTerm, MEMORY_DATABASE.terms, this.id);
        if (!maybeTerm) throw new GenericException(ERRORS.NOT_FOUND.TERM);
        return maybeTerm;
    }

    public async setTerm(termId: string): Promise<void> {
        const oldTerm = await this.getTerm()
        if(oldTerm) removeChildFromParent(MEMORY_DATABASE.courseClassesOfTerm, oldTerm.id, this.id);
        addChildToParent(MEMORY_DATABASE.courseClassesOfTerm, termId, this.id);
    }

    public async getLectures(): Promise<Lecture[]> {
        const lectures = getChildsFromParent<Lecture>(MEMORY_DATABASE.lecturesOfCourseClass, MEMORY_DATABASE.lectures, this.id);
        lectures.sort((a,b) => a.time.compareTo(b.time));
        return lectures;
    }

    public async getWeeklyClassTimeInMinutes(): Promise<number> {
        const lectures = await this.getLectures();
        let duration = 0;
        for(const l of lectures)
            duration += l.time.getDurationInMinutes();
        return duration;
    }

    public async getDaysWithLectures(): Promise<Set<DAY>> {
        const lectures = await this.getLectures();
        const busyDays = new Set<DAY>();
        for(const l of lectures)
            busyDays.add(l.time.dayOfWeek);
        return busyDays;
    }

    public async getCourse(): Promise<Course> {
        const maybeCourse = getParentFromChild<Course>(
            MEMORY_DATABASE.courseClassesOfCourse,
            MEMORY_DATABASE.courses,
            this.id,
        );
        if (!maybeCourse) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
        return maybeCourse;
    }

    public async setCourse(courseId: string): Promise<void> {
        const oldCourse = await this.getCourse()
        if(oldCourse) removeChildFromParent(MEMORY_DATABASE.courseClassesOfCourse, oldCourse.id, this.id);
        addChildToParent(MEMORY_DATABASE.courseClassesOfCourse, courseId, this.id);
    }
}
