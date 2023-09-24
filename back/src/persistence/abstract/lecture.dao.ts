import { ERRORS } from '../../constants/error.constants';
import TimeRange from '../../helpers/classes/timeRange.class';
import { PaginatedCollection } from '../../interfaces/paging.interface';
import Lecture from '../../models/abstract/lecture.model';
import GenericDao from './generic.dao';

export default abstract class LectureDao extends GenericDao<Lecture> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.LECTURE);
    }

    // Abstract Methods Signature Override
    public abstract create(universityId: string, courseClassId: string, timeRange: TimeRange, buildingId: string): Promise<Lecture>;
    public abstract modify(id: string, universityIdFilter: string, courseClassIdFilter?: string, timeRange?: TimeRange, buildingId?: string): Promise<Lecture>;
    public abstract delete(id: string, universityIdFilter: string, courseClassIdFilter?: string): Promise<void>;

    public abstract findById(id: string, universityIdFilter?: string, courseClassIdFilter?: string): Promise<Lecture | undefined>;
    public abstract findPaginated(page: number, limit: number, times?: TimeRange[], courseClassId?: string, buildingId?: string, universityId?: string): Promise<PaginatedCollection<Lecture>>;

    // Abstract Methods

    // Public Methods Override
    public override async getById(id: string, universityIdFilter?: string, courseClassIdFilter?: string): Promise<Lecture> {
        return await super.getById(id, universityIdFilter, courseClassIdFilter);
    }
}
