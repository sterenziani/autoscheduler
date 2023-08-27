import CourseClassDao from '../persistence/abstract/courseClass.dao';
import CourseClassDaoFactory from '../factories/courseClassDao.factory';
import BuildingService from './building.service';
import LectureDao from '../persistence/abstract/lecture.dao';
import LectureDaoFactory from '../factories/lectureDao.factory';
import { ILecture } from '../interfaces/courseClass.interface';
import CourseClass from '../models/abstract/courseClass.model';
import UniversityService from './university.service';
import TermService from './term.service';
import CourseService from './course.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';

export default class CourseClassService {
    private static instance: CourseClassService;
    private buildingService!: BuildingService;
    private courseService!: CourseService;
    private termService!: TermService;
    private universityService!: UniversityService;

    private dao: CourseClassDao;
    private lectureDao: LectureDao;

    static getInstance(): CourseClassService {
        if (!CourseClassService.instance) {
            CourseClassService.instance = new CourseClassService();
        }
        return CourseClassService.instance;
    }

    constructor() {
        this.dao = CourseClassDaoFactory.get();
        this.lectureDao = LectureDaoFactory.get();
    }

    init() {
        this.buildingService = BuildingService.getInstance();
        this.courseService = CourseService.getInstance();
        this.termService = TermService.getInstance();
        this.universityService = UniversityService.getInstance();
    }

    // public methods

    async getCourseClass(id: string): Promise<CourseClass> {
        return await this.dao.getById(id);
    }

    async getCourseClassesByCourse(
        courseId: string,
        termId?: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<CourseClass>> {
        return await this.dao.findByCourseId(courseId, termId, text, limit, offset);
    }

    async createCourseClass(
        universityId: string,
        courseId: string,
        termId: string,
        name: string,
        lectures: ILecture[],
    ) {
        // validate existence of universityId, courseId, termId & buildingIds
        await this.universityService.getUniversity(universityId);
        const course = await this.courseService.getCourse(courseId);
        const courseUniversity = await course.getUniversity();

        // check if a building with internalId already exists
        const matches = await this.dao.findByCourseId(courseId, termId, name)
        if (matches.collection && matches.collection.length > 0)
            throw new GenericException(ERRORS.BAD_REQUEST.COURSE_CLASS_ALREADY_EXISTS);

        if (courseUniversity.id !== universityId) throw new GenericException(ERRORS.NOT_FOUND.COURSE);
        await this.termService.getTerm(termId);
        await Promise.all(
            lectures.map(async (l) => {
                const building = await this.buildingService.getBuilding(l.buildingId);
                if (!building) throw new GenericException(ERRORS.NOT_FOUND.BUILDING);
            }),
        );

        // TODO add session logic for transactional operations
        const courseClass = await this.dao.create(courseId, termId, name);
        await Promise.all(
            lectures.map(async (l) => {
                await this.lectureDao.create(courseClass.id, l.buildingId, l.time);
            }),
        );

        return courseClass;
    }
}
