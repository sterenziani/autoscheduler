import CourseClassDao from '../persistence/abstract/courseClass.dao';
import CourseClassDaoFactory from '../factories/courseClassDao.factory';
import CourseClass from '../models/abstract/courseClass.model';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { cleanMaybeText, cleanText } from '../helpers/string.helper';

export default class CourseClassService {
    private static instance: CourseClassService;

    private dao: CourseClassDao;

    static getInstance(): CourseClassService {
        if (!CourseClassService.instance) {
            CourseClassService.instance = new CourseClassService();
        }
        return CourseClassService.instance;
    }

    constructor() {
        this.dao = CourseClassDaoFactory.get();
    }

    init() {
        // Do nothing
    }

    // public methods

    async getCourseClass(id: string, universityIdFilter?: string, courseIdFilter?: string): Promise<CourseClass> {
        return await this.dao.getById(id, universityIdFilter, courseIdFilter);
    }

    async getCourseClasses(page: number, limit: number, textSearch?: string, courseId?: string, termId?: string, universityId?: string): Promise<PaginatedCollection<CourseClass>> {
        return await this.dao.findPaginated(page, limit, cleanMaybeText(textSearch), courseId, termId, universityId);
    }

    async createCourseClass(universityId: string, courseId: string, termId: string, name: string, internalId?: string): Promise<CourseClass> {
        return await this.dao.create(universityId, courseId, termId, internalId ?? `${courseId}-${termId}-${cleanText(name)}`, name);
    }

    async modifyCourseClass(id: string, universityIdFilter: string, courseIdFilter?: string, termId?: string, name?: string, internalId?: string): Promise<CourseClass> {
        return await this.dao.modify(id, universityIdFilter, courseIdFilter, termId, internalId ?? `${courseIdFilter}-${termId}-${cleanText(name?? "")}`, name);
    }

    async deleteCourseClass(id: string, universityIdFilter: string, courseIdFilter?: string): Promise<void> {
        return await this.dao.delete(id, universityIdFilter, courseIdFilter);
    }
}
