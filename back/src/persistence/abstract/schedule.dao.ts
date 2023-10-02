import { IScheduleInputData } from '../../interfaces/schedule.interface';

export default abstract class ScheduleDao {

    // Abstract Methods
    public abstract getScheduleInfo(universityId: string, programId: string, termId: string, studentId: string): Promise<IScheduleInputData>;
}
