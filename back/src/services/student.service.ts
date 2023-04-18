import PersistenceService from './persistence/persistence.service';
import PersistenceFactory from '../factories/persistence.factory';
import Student from '../models/abstract/student.model';

export default class StudentService {
    private static instance: StudentService;
    
    private persistenceService: PersistenceService;

    constructor() {
        this.persistenceService = PersistenceFactory.get();
    }

    static getInstance = (): StudentService => {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    };

    // public methods

    async getStudent(id: string): Promise<Student> {
        return await this.persistenceService.getStudent(id);
    }
}
