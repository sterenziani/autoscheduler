import LectureDao from '../persistence/abstract/lecture.dao';
import LectureDaoFactory from '../factories/lectureDao.factory';
import { PaginatedCollection } from '../interfaces/paging.interface';
import Lecture from '../models/abstract/lecture.model';
import TimeRange from '../helpers/classes/timeRange.class';

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
        // Do Nothing
    }

    // public methods

    async getLecture(id: string, universityIdFilter?: string, courseClassIdFilter?: string): Promise<Lecture> {
        return await this.dao.getById(id, universityIdFilter, courseClassIdFilter);
    }

    async getLectures(page: number, limit: number, times?: TimeRange[], courseClassId?: string, buildingId?: string, universityId?: string): Promise<PaginatedCollection<Lecture>> {
        return await this.dao.findPaginated(page, limit, times, courseClassId, buildingId, universityId);
    }

    async createLecture(universityId: string, courseClassId: string, timeRange: TimeRange, buildingId: string): Promise<Lecture> {
        return await this.dao.create(universityId, courseClassId, timeRange, buildingId);
    }

    async modifyLecture(id: string, universityIdFilter: string, courseClassIdFilter?: string, timeRange?: TimeRange, buildingId?: string): Promise<Lecture> {
        return await this.dao.modify(id, universityIdFilter, courseClassIdFilter, timeRange, buildingId);
    }

    async deleteLecture(id: string, universityIdFilter: string, courseClassIdFilter?: string): Promise<void> {
        return await this.dao.delete(id, universityIdFilter, courseClassIdFilter);
    }
}
