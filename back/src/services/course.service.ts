import CourseDaoFactory from '../factories/courseDao.factory';
import CourseDao from '../persistence/abstract/course.dao';
import Course from '../models/abstract/course.model';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { cleanMaybeText } from '../helpers/string.helper';

export default class CourseService {
    private static instance: CourseService;

    private dao: CourseDao;

    static getInstance(): CourseService {
        if (!CourseService.instance) {
            CourseService.instance = new CourseService();
        }
        return CourseService.instance;
    }

    constructor() {
        this.dao = CourseDaoFactory.get();
    }

    init() {
        // Do nothing
    }

    // public methods

    async getCourse(id: string, universityIdFilter?: string): Promise<Course> {
        return await this.dao.getById(id, universityIdFilter);
    }

    async getCourses(page: number, limit: number, textSearch?: string, programId?: string, optional?: boolean, universityId?: string): Promise<PaginatedCollection<Course>> {
        // Optional only makes sense if programId is provided
        if (programId === undefined) optional = undefined;
        return await this.dao.findPaginated(page, limit, cleanMaybeText(textSearch), programId, optional, universityId);
    }

    async createCourse(universityId: string, internalId: string, name: string): Promise<Course> {
        return await this.dao.create(universityId, internalId, name);
    }

    async modifyCourse(id: string, universityIdFilter: string, internalId?: string, name?: string): Promise<Course> {
        return await this.dao.modify(id, universityIdFilter, internalId, name);
    }

    async deleteCourse(id: string, universityIdFilter: string): Promise<void> {
        return await this.dao.delete(id, universityIdFilter);
    }

    async getRequiredCourses(page: number, limit: number, id: string, textSearch?: string, programId?: string, universityId?: string): Promise<PaginatedCollection<Course>> {
        return await this.dao.findPaginatedRequiredCourses(page, limit, id, cleanMaybeText(textSearch), programId, universityId);
    }

    async getRemainingCourses(page: number, limit: number, studentId: string, programId: string, universityId: string, textSearch?: string, optional?: boolean): Promise<PaginatedCollection<Course>> {
        return await this.dao.findPaginatedRemainingCourses(page, limit, studentId, programId, universityId, cleanMaybeText(textSearch), optional);
    }

    async getCompletedCourses(page: number, limit: number, studentId: string, textSearch?: string, optional?: boolean, programId?: string, universityId?: string): Promise<PaginatedCollection<Course>> {
        return await this.dao.findPaginatedCompletedCourses(page, limit, studentId, cleanMaybeText(textSearch), optional, programId, universityId);
    }
}
