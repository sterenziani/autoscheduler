import IStudentMapper from '../interfaces/student.mapper';
import { IStudent } from '../../models/student.model';

class MemoryStudentMapper implements IStudentMapper {
    private static instance: IStudentMapper;
    private students: IStudent[];

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

    async getStudentById(userId: string): Promise<IStudent | null> {
        const maybeStudent = this.students.find((s) => s.id === userId);
        return maybeStudent ? (maybeStudent as IStudent) : null;
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        const firstStudent: IStudent = {
            id: 'primero',
            universityId: 'universidadItba',
            programId: 'itbaInformatica',
        };
        const secondStudent: IStudent = {
            id: 'segundo',
            universityId: 'universidadItba',
            programId: 'itbaInformatica',
        };
        const thirdStudent: IStudent = {
            id: 'tercero',
            universityId: 'universidadUba',
            programId: 'ubaInformatica',
        };

        this.students.push(firstStudent, secondStudent, thirdStudent);
    }
}

export default MemoryStudentMapper;
