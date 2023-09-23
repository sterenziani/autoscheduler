import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { addChildToParent } from '../../../helpers/persistence/memoryPersistence.helper';
import Student from '../../../models/abstract/student.model';
import MemoryStudent from '../../../models/implementations/memory/memoryStudent.model';
import StudentDao from '../../abstract/student.dao';
import MemoryProgramDao from './memoryProgram.dao';
import MemoryUniversityDao from './memoryUniversity.dao';
import MemoryUserDao from './memoryUser.dao';

export default class MemoryStudentDao extends StudentDao {
    private static instance: StudentDao;

    static getInstance = () => {
        if (!MemoryStudentDao.instance) {
            MemoryStudentDao.instance = new MemoryStudentDao();
        }
        return MemoryStudentDao.instance;
    };

    // Abstract Methods Implementations
    public async init(): Promise<void> {
        return;
    }
    
    public async create(
        userId: string,
        programId: string,
        name: string,
    ): Promise<Student> {
        // We get user, university and program to check that they exist
        const user = await MemoryUserDao.getInstance().getById(userId);
        const program = await MemoryProgramDao.getInstance().getById(programId);
        const university = await program.getUniversity();
        const newStudent = new MemoryStudent(user.id, user.email, user.password, user.locale, name);

        MEMORY_DATABASE.students.set(newStudent.id, newStudent);
        addChildToParent(MEMORY_DATABASE.studentsOfUniversity, university.id, newStudent.id);
        addChildToParent(MEMORY_DATABASE.studentsOfProgram, program.id, newStudent.id);

        return newStudent;
    }

    public async findById(id: string): Promise<Student | undefined> {
        return MEMORY_DATABASE.students.get(id);
    }

    public async set(student: Student): Promise<void> {
        await this.getById(student.id);

        if (!(student instanceof MemoryStudent))
            student = new MemoryStudent(student.id, student.email, student.password, student.locale, student.name);

        MEMORY_DATABASE.students.set(student.id, student);
    }
}
