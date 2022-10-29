import IUniversityMapper from '../interfaces/university.mapper';
import { IUniversity } from '../../models/university.model';

class MemoryUniversityMapper implements IUniversityMapper {
    private static instance: IUniversityMapper;
    private universities: IUniversity[];

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

    async getUniversityById(userId: string): Promise<IUniversity | null> {
        const maybeUniversity = this.universities.find((s) => s.id === userId);
        return maybeUniversity ? (maybeUniversity as IUniversity) : null;
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        const firstUniversity: IUniversity = {
            id: 'universidadItba',
            name: 'Instituto Tecnológico de Buenos Aires',
            verified: true,
        };
        const secondUniversity: IUniversity = {
            id: 'universidadUba',
            name: 'Universidad de Buenos Aires',
            verified: true,
        };
        const thirdUniversity: IUniversity = {
            id: 'universidadFake',
            name: 'Universidad de Mentira aún no verificada',
            verified: false,
        };

        this.universities.push(firstUniversity, secondUniversity, thirdUniversity);
    }
}

export default MemoryUniversityMapper;
