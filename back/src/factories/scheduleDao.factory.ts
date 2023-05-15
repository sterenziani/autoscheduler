import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import ScheduleDao from '../persistence/abstract/schedule.dao';
import MemoryScheduleDao from '../persistence/implementations/memory/memorySchedule.dao';
import GenericDaoFactory from './genericDao.factory';

export default class ScheduleDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): ScheduleDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryScheduleDao.getInstance();
        }
    }
}
