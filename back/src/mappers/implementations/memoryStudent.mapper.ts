import IStudentMapper from '../interfaces/student.mapper';
import { Student } from '../../models/student.interface';

class MemoryStudentMapper implements IStudentMapper {
    private static instance: IStudentMapper;
    private students: Student[];

    constructor() {
        this.students = [];

        // populate students
        this._populate();
    }

    static getInstance = (): IStudentMapper => {
        if (!MemoryStudentMapper.instance) {
            MemoryStudentMapper.instance = new MemoryStudentMapper();
        }
        return MemoryStudentMapper.instance;
    };

    async getStudentById(userId: string): Promise<Student | null> {
        const maybeStudent = this.students.find((s) => s.id === userId);
        return maybeStudent ? (maybeStudent as Student) : null;
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        const firstStudent: Student = {
            id: 'primero',
            universityId: 'universidadItba',
            programId: 'itbaInformatica',
        };
        const secondStudent: Student = {
            id: 'segundo',
            universityId: 'universidadItba',
            programId: 'itbaInformatica',
        };
        const thirdStudent: Student = {
            id: 'tercero',
            universityId: 'universidadUba',
            programId: 'ubaInformatica',
        };

        this.students.push(firstStudent, secondStudent, thirdStudent);
    }
}

export default MemoryStudentMapper;
