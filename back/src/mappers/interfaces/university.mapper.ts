import { University } from '../../models/university.interface';

interface IUniversityMapper {
    getUniversityById(userId: string): Promise<University | null>;
}

export default IUniversityMapper;
