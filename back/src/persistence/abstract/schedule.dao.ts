import { IScheduleInputData } from '../../interfaces/schedule.interface';
import TimeRange from '../../helpers/classes/timeRange.class';

export default abstract class ScheduleDao {
    public abstract getScheduleInfo(
        universityId: string,
        programId: string,
        termId: string,
        studentId: string,
        unavailableTimeSlots: TimeRange[]
    ): Promise<IScheduleInputData>;
}
