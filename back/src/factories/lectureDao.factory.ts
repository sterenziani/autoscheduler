import LectureDao from '../persistence/abstract/lecture.dao';

export default class LectureDaoFactory {
    // Static Getters
    public static get(): LectureDao {
        throw new Error('Not Implemented');
    }
}
