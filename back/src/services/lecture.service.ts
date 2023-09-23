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
import Lecture from '../models/abstract/lecture.model';

export default class LectureService {
    private static instance: LectureService;

    private dao: LectureDao;

    static getInstance(): LectureService {
        if (!LectureService.instance) {
            LectureService.instance = new LectureService();
        }
        return LectureService.instance;
    }

    constructor() {
        this.dao = LectureDaoFactory.get();
    }

    init() {
    }

    // public methods

    async getLectures(limit: number, offset: number): Promise<PaginatedCollection<Lecture>> {
        return await this.dao.findById(limit, offset);
    }
}
