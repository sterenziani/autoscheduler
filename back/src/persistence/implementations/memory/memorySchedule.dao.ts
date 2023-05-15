import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { addChildToParent } from '../../../helpers/persistence/memoryPersistence.helper';
import Schedule from '../../../models/abstract/schedule.model';
import MemorySchedule from '../../../models/implementations/memory/memorySchedule.model';
import ScheduleDao from '../../abstract/schedule.dao';
import MemoryStudentDao from './memoryStudent.dao';
import MemoryTermDao from './memoryTerm.dao';
import { v4 as uuidv4 } from 'uuid';

export default class MemoryScheduleDao extends ScheduleDao {
    private static instance: ScheduleDao;

    static getInstance = () => {
        if (!MemoryScheduleDao.instance) {
            MemoryScheduleDao.instance = new MemoryScheduleDao();
        }
        return MemoryScheduleDao.instance;
    };

    // Abstract Methods Implementations
    public async create(studentId: string, termId: string): Promise<Schedule> {
        // We get student and term to check that they exist
        const student = await MemoryStudentDao.getInstance().getById(studentId);
        const term = await MemoryTermDao.getInstance().getById(termId);
        const newSchedule = new MemorySchedule(uuidv4());

        MEMORY_DATABASE.schedules.set(newSchedule.id, newSchedule);
        addChildToParent(MEMORY_DATABASE.schedulesOfStudent, student.id, newSchedule.id);
        addChildToParent(MEMORY_DATABASE.schedulesOfTerm, term.id, newSchedule.id);

        return newSchedule;
    }

    public async findById(id: string): Promise<Schedule | undefined> {
        return MEMORY_DATABASE.schedules.get(id);
    }

    public async set(schedule: Schedule): Promise<void> {
        await this.getById(schedule.id);

        if (!(schedule instanceof MemorySchedule)) schedule = new MemorySchedule(schedule.id);

        MEMORY_DATABASE.schedules.set(schedule.id, schedule);
    }
}
