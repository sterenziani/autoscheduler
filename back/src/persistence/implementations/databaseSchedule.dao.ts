import ScheduleDao from '../abstract/schedule.dao';
import { IScheduleInputData } from '../../interfaces/schedule.interface';
import { graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';

export default class DatabaseScheduleDao extends ScheduleDao {
    private static instance: ScheduleDao;

    static getInstance = () => {
        if (!DatabaseScheduleDao.instance) {
            DatabaseScheduleDao.instance = new DatabaseScheduleDao();
        }
        return DatabaseScheduleDao.instance;
    };

    async getScheduleInfo(universityId: string, programId: string, termId: string, studentId: string): Promise<IScheduleInputData> {
        const session = graphDriver.session();
        try {
            const result = await session.run(
                'MATCH (s:Student {id: $studentId})-[:ENROLLED_IN]->(u:University {id:$universityId)<-[:BELONGS_TO]-(p:Program {id: $programId})<-[in:IN]-(c:Course) ' +
                'WHERE NOT EXISTS((s)-[:COMPLETED]-(c)) ',
                {universityId, programId, termId, studentId}
            );
            
        } catch (err) {
            throw parseErrors(err, '[ScheduleDao:getScheduleInfo]');
        } finally {
            await session.close();
        }
    }
}
