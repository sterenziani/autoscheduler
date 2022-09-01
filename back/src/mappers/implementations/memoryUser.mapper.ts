import {IUser} from '../../models/user.model';
import IUserMapper from "../interfaces/user.mapper";
import {ROLES} from "../../constants/general.constants";

class MemoryUserMapper implements IUserMapper {
    private static instance: IUserMapper;
    private students: IUser[];

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
        const firstStudent: IUser = {
            id: 'primero',
            name: 'estudiante1',
            email: 'estudiante1@itba.edu.ar',
            password: '$2b$10$ZUCZE1eFiz3TBzZD1m/pnu7aOCVL9uwcOulGVQhLHUVkP1xCnHJnC', // 'estudiante1'
            role: ROLES.STUDENT,
        };
        const secondStudent: IUser = {
            id: 'segundo',
            name: 'estudiante2',
            email: 'estudiante2@itba.edu.ar',
            password: '$2b$10$qh9MQIwPm35vMd8b2dyQO.Qo.AWrfNqC7j2kLkumNR22nJLCjkn8y', // 'estudiante2'
            role: ROLES.STUDENT,
        };
        const thirdStudent: IUser = {
            id: 'tercero',
            name: 'estudiante3',
            email: 'estudiante3@itba.edu.ar',
            password: "$2b$10$8oi..kfRPXtdNPnVtQ3hfOTpmLxozAIcjjNKfj8gj3B4BuzAlLrVy'", // 'estudiante3'
            role: ROLES.STUDENT,
        };

        this.students.push(firstStudent, secondStudent, thirdStudent);
    }
}

export default MemoryUserMapper;
