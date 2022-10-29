import { ICourse } from '../../models/course.model';

interface ICourseMapper {
    getStudentCompletedCourses(userId: string): Promise<ICourse[]>;

    getRequiredCourses(courseId: string, programId: string): Promise<ICourse[]>;
}

export default ICourseMapper;
