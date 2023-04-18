import IUniversityMapper from '../interfaces/university.mapper';
import { University } from '../../models/university.interface';

class MemoryUniversityMapper implements IUniversityMapper {
    private static instance: IUniversityMapper;
    private universities: University[];

    constructor() {
        this.universities = [];

        // populate students
        this._populate();
    }

    static getInstance = (): IUniversityMapper => {
        if (!MemoryUniversityMapper.instance) {
            MemoryUniversityMapper.instance = new MemoryUniversityMapper();
        }
        return MemoryUniversityMapper.instance;
    };

    async getUniversityById(userId: string): Promise<University | null> {
        const maybeUniversity = this.universities.find((s) => s.id === userId);
        return maybeUniversity ? (maybeUniversity as University) : null;
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        const firstUniversity: University = {
            id: 'universidadItba',
            name: 'Instituto Tecnológico de Buenos Aires',
            verified: true,
        };
        const secondUniversity: University = {
            id: 'universidadUba',
            name: 'Universidad de Buenos Aires',
            verified: true,
        };
        const thirdUniversity: University = {
            id: 'universidadFake',
            name: 'Universidad de Mentira aún no verificada',
            verified: false,
        };

        this.universities.push(firstUniversity, secondUniversity, thirdUniversity);
    }
}

export default MemoryUniversityMapper;
