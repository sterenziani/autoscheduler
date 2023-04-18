import { ERRORS } from "../../../constants/error.constants";
import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import GenericException from "../../../exceptions/generic.exception";
import { getChildsFromParent, getChildsFromParents, getParentFromChild } from "../../../helpers/persistence/memoryPersistence.helper";
import Course from "../../abstract/course.model";
import CourseClass from "../../abstract/courseClass.model";
import University from "../../abstract/university.model";

export default class MemoryCourse extends Course {

    /////////////////// Abstract Methods Implementation ///////////////////
    public async setRequiredCourse(courseId: string): Promise<void> {
        const map = MEMORY_DATABASE.requiredCoursesOfCourse;
        // If this is the first time we have to initialize the array
        if (!map.get(this.id))
            map.set(this.id, new Set());
        
        // Now we can safely add to the array
        map.get(this.id)!.add(courseId);
    }

    public async getRequiredCourses(): Promise<Course[]> {
        return getChildsFromParent<Course>(MEMORY_DATABASE.requiredCoursesOfCourse, MEMORY_DATABASE.courses, this.id);
    }

    // I know this is inefficient but i don't see the point of making it better when memory database is just for testing
    public async getCourseClasses(termId: string): Promise<CourseClass[]> {
        return getChildsFromParents<CourseClass>(MEMORY_DATABASE.courseClassesOfCourse, MEMORY_DATABASE.courseClassesOfTerm, MEMORY_DATABASE.courseClasses, this.id, termId);
    }

    public async getUniversity(): Promise<University> {
        const maybeUniversity = getParentFromChild<University>(MEMORY_DATABASE.coursesOfUniversity, MEMORY_DATABASE.universities, this.id);
        if (!maybeUniversity) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
        return maybeUniversity;
    }
}