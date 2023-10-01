import ScheduleDao from '../persistence/abstract/schedule.dao';
import DatabaseScheduleDao from '../persistence/implementations/databaseSchedule.dao';

export default class ScheduleDaoFactory {
    // Static Getters
    public static get(): ScheduleDao {
        return DatabaseScheduleDao.getInstance();
    }
}
