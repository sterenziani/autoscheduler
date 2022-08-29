import IStudentMapper from '../interfaces/student.mapper';
import { IStudent } from '../../models/student.model';
import { IUser } from '../../models/user.model';

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

    async getUserByEmail(email: string): Promise<IUser | null> {
        const maybeUser = this.students.find((s) => s.email === email);
        return maybeUser ? (maybeUser as IUser) : null;
    }

    async getUserById(userId: string): Promise<IUser | null> {
        const maybeUser = this.students.find((s) => s.id === userId);
        return maybeUser ? (maybeUser as IUser) : null;
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        const firstStudent: IStudent = {
            id: 'primero',
            name: 'estudiante1',
            email: 'estudiante1@itba.edu.ar',
            password: '$2b$10$ZUCZE1eFiz3TBzZD1m/pnu7aOCVL9uwcOulGVQhLHUVkP1xCnHJnC', // 'estudiante1'
        };
        const secondStudent: IStudent = {
            id: 'segundo',
            name: 'estudiante2',
            email: 'estudiante2@itba.edu.ar',
            password: '$2b$10$qh9MQIwPm35vMd8b2dyQO.Qo.AWrfNqC7j2kLkumNR22nJLCjkn8y', // 'estudiante2'
        };
        const thirdStudent: IStudent = {
            id: 'tercero',
            name: 'estudiante3',
            email: 'estudiante3@itba.edu.ar',
            password: "$2b$10$8oi..kfRPXtdNPnVtQ3hfOTpmLxozAIcjjNKfj8gj3B4BuzAlLrVy'", // 'estudiante3'
        };

        this.students.push(firstStudent, secondStudent, thirdStudent);
    }
}

export default MemoryStudentMapper;
