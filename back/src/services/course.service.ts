import ICourseMapper from '../mappers/interfaces/course.mapper';
import CourseMapperFactory from '../mappers/factories/courseMapper.factory';
import { Course } from '../models/course.interface';

class CourseService {
    private static instance: CourseService;
    private courseMapper: ICourseMapper;

    constructor() {
        this.courseMapper = CourseMapperFactory.get();
    }

    static getInstance = (): CourseService => {
        if (!CourseService.instance) {
            CourseService.instance = new CourseService();
        }
        return CourseService.instance;
    };

    // public methods

    async getStudentCompletedCourses(studentId: string): Promise<Course[]> {
        return this.courseMapper.getStudentCompletedCourses(studentId);
    }
}
export default CourseService;
