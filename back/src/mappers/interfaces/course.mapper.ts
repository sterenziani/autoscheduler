import { Course } from '../../models/course.interface';

interface ICourseMapper {
    getStudentCompletedCourses(userId: string): Promise<Course[]>;

    getRequiredCourses(courseId: string, programId: string): Promise<Course[]>;
}

export default ICourseMapper;
