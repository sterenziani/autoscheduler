import { ERRORS } from '../../constants/error.constants';
import Schedule from '../../models/abstract/schedule.model';
import GenericDao from './generic.dao';

export default abstract class ScheduleDao extends GenericDao<Schedule> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.SCHEDULE);
    }

    // Abstract Methods
    public abstract create(studentId: string, termId: string): Promise<Schedule>;
}
