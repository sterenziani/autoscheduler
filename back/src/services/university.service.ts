import IUniversityMapper from '../mappers/interfaces/university.mapper';
import { IUniversity } from '../models/university.model';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UniversityMapperFactory from '../mappers/factories/universityMapper.factory';

class UniversityService {
    private static instance: UniversityService;
    private universityMapper: IUniversityMapper;

    constructor() {
        this.universityMapper = UniversityMapperFactory.get();
    }

    static getInstance = (): UniversityService => {
        if (!UniversityService.instance) {
            UniversityService.instance = new UniversityService();
        }
        return UniversityService.instance;
    };

    // public methods

    async getUniversity(id: string): Promise<IUniversity> {
        const university: IUniversity | null = await this.universityMapper.getUniversityById(id);
        if (!university) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);

        return university;
    }
}
export default UniversityService;
