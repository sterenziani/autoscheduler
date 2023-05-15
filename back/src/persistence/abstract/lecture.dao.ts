import { ERRORS } from '../../constants/error.constants';
import TimeRange from '../../helpers/classes/timeRange.class';
import Lecture from '../../models/abstract/lecture.model';
import GenericDao from './generic.dao';

export default abstract class LectureDao extends GenericDao<Lecture> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.LECTURE);
    }

    // Abstract Methods
    public abstract create(courseClassId: string, buildingId: string, time: TimeRange): Promise<Lecture>;
}
