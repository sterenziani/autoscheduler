import LectureDao from '../persistence/abstract/lecture.dao';
import DatabaseLectureDao from '../persistence/implementations/databaseLecture.dao';

export default class LectureDaoFactory {
    // Static Getters
    public static get(): LectureDao {
        return DatabaseLectureDao.getInstance();
    }
}
