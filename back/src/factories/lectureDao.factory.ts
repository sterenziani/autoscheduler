import { PERSISTENCE } from '../constants/persistence/persistence.contants';
import LectureDao from '../persistence/abstract/lecture.dao';
import MemoryLectureDao from '../persistence/implementations/memory/memoryLecture.dao';
import GenericDaoFactory from './genericDao.factory';

export default class LectureDaoFactory extends GenericDaoFactory {
    // Static Getters
    public static get(): LectureDao {
        const persistence = this.getPersistence();
        switch (persistence) {
            case PERSISTENCE.DATABASE:
                throw new Error('Not implemented');
            case PERSISTENCE.MEMORY:
                return MemoryLectureDao.getInstance();
        }
    }
}
