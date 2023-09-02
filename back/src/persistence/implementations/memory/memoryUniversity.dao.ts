import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import University from '../../../models/abstract/university.model';
import MemoryUniversity from '../../../models/implementations/memory/memoryUniversity.model';
import UniversityDao from '../../abstract/university.dao';
import MemoryUserDao from './memoryUser.dao';
import { PaginatedCollection } from '../../../interfaces/paging.interface';
import { paginateCollection } from '../../../helpers/collection.helper';

export default class MemoryUniversityDao extends UniversityDao {
    private static instance: UniversityDao;

    static getInstance = () => {
        if (!MemoryUniversityDao.instance) {
            MemoryUniversityDao.instance = new MemoryUniversityDao();
        }
        return MemoryUniversityDao.instance;
    };

    // Abstract Methods Implementations
    public async create(userId: string, name: string, verified: boolean): Promise<University> {
        // We get the user to check that it exists and to get the rest of the info
        const user = await MemoryUserDao.getInstance().getById(userId);
        const newUniversity = new MemoryUniversity(user.id, user.email, user.password, name, verified);
        MEMORY_DATABASE.universities.set(newUniversity.id, newUniversity);
        return newUniversity;
    }

    public async findById(id: string): Promise<University | undefined> {
        return MEMORY_DATABASE.universities.get(id);
    }

    public async set(university: University): Promise<void> {
        await this.getById(university.id);

        if (!(university instanceof MemoryUniversity))
            university = new MemoryUniversity(
                university.id,
                university.email,
                university.password,
                university.name,
                university.verified,
            );

        MEMORY_DATABASE.universities.set(university.id, university);
    }

    public async findByName(name: string): Promise<University | undefined> {
        for (const maybeUniversity of MEMORY_DATABASE.universities.values()) {
            if (maybeUniversity.name === name) return maybeUniversity;
        }
        return undefined;
    }

    public async findByText(text?: string, limit?: number, offset?: number): Promise<PaginatedCollection<University>> {
        text = text ? text.toLowerCase() : text;
        const universities: University[] = [];

        for (const maybeUniversity of MEMORY_DATABASE.universities.values()) {
            if (!text || maybeUniversity.name.toLowerCase().includes(text)) universities.push(maybeUniversity);
        }

        // sorting by name
        const compareUniversities = (u1: University, u2: University) => {
            if (u1.name < u2.name) return -1;
            if (u1.name > u2.name) return 1;
            return 0;
        };

        return paginateCollection(universities, compareUniversities, limit, offset);
    }
}
