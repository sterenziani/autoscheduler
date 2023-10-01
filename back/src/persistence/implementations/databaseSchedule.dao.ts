import { getLastPageFromCount, getSkipFromPageLimit, simplePaginateCollection } from '../../helpers/collection.helper';
import ScheduleDao from '../abstract/schedule.dao';
import { buildQuery, deglobalizeField, getGlobalRegex, getNode, getNodes, getRegex, getRelId, getStats, getToIdFromRelId, getValue, globalizeField, graphDriver, logErrors, parseErrors, toGraphInt } from '../../helpers/persistence/graphPersistence.helper';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';
import { Integer } from 'neo4j-driver';
import { cleanMaybeText, decodeText, encodeText } from '../../helpers/string.helper';
import { IScheduleInputData } from '../../interfaces/schedule.interface';
import TimeRange from '../../helpers/classes/timeRange.class';

export default class DatabaseScheduleDao extends ScheduleDao {
    private static instance: ScheduleDao;

    static getInstance = () => {
        if (!DatabaseScheduleDao.instance) {
            DatabaseScheduleDao.instance = new DatabaseScheduleDao();
        }
        return DatabaseScheduleDao.instance;
    };

    async getScheduleInfo(
        universityId: string,
        programId: string,
        termId: string,
        studentId: string,
        unavailableTimeSlots: TimeRange[]
    ): Promise<IScheduleInputData> {
        throw new Error("Method not implemented.")
    }
}
