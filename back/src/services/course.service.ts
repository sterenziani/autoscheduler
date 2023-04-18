import PersistenceService from './persistence/persistence.service';
import PersistenceFactory from '../factories/persistence.factory';
import Course from '../models/abstract/course.model';

export default class CourseService {
    private static instance: CourseService;
    
    private persistenceService: PersistenceService;

    constructor() {
        this.persistenceService = PersistenceFactory.get();
    }

    static getInstance = (): CourseService => {
        if (!CourseService.instance) {
            CourseService.instance = new CourseService();
        }
        return CourseService.instance;
    };

    // public methods

    // TODO: whoever is querying this can just query for a student and then use the getcompletedCourses() outside of this service, that is how it should be used
    async getStudentCompletedCourses(studentId: string): Promise<Course[]> {
        const student = await this.persistenceService.getStudent(studentId);
        return await student.getCompletedCourses();
    }
}
