import { User } from '../../models/user.interface';
import IUserMapper from '../interfaces/user.mapper';
import { ROLE } from '../../constants/general.constants';

class MemoryUserMapper implements IUserMapper {
    private static instance: IUserMapper;
    private students: User[];

    constructor() {
        this.students = [];

        // populate students
        this._populate();
    }

    static getInstance = (): IUserMapper => {
        if (!MemoryUserMapper.instance) {
            MemoryUserMapper.instance = new MemoryUserMapper();
        }
        return MemoryUserMapper.instance;
    };

    async getUserByEmail(email: string): Promise<User | null> {
        const maybeUser = this.students.find((s) => s.email === email);
        return maybeUser ? (maybeUser as User) : null;
    }

    async getUserById(userId: string): Promise<User | null> {
        const maybeUser = this.students.find((s) => s.id === userId);
        return maybeUser ? (maybeUser as User) : null;
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        const firstStudent: User = {
            id: 'primero',
            name: 'estudiante1',
            email: 'estudiante1@itba.edu.ar',
            password: '$2b$10$ZUCZE1eFiz3TBzZD1m/pnu7aOCVL9uwcOulGVQhLHUVkP1xCnHJnC', // 'estudiante1'
            role: ROLE.STUDENT,
        };
        const secondStudent: User = {
            id: 'segundo',
            name: 'estudiante2',
            email: 'estudiante2@itba.edu.ar',
            password: '$2b$10$qh9MQIwPm35vMd8b2dyQO.Qo.AWrfNqC7j2kLkumNR22nJLCjkn8y', // 'estudiante2'
            role: ROLE.STUDENT,
        };
        const thirdStudent: User = {
            id: 'tercero',
            name: 'estudiante3',
            email: 'estudiante3@itba.edu.ar',
            password: '$2b$10$8oi..kfRPXtdNPnVtQ3hfOTpmLxozAIcjjNKfj8gj3B4BuzAlLrVy', // 'estudiante3'
            role: ROLE.STUDENT,
        };

        this.students.push(firstStudent, secondStudent, thirdStudent);
    }
}

export default MemoryUserMapper;
