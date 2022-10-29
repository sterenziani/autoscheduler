import { IUniversity } from '../../models/university.model';

interface IUniversityMapper {
    getUniversityById(userId: string): Promise<IUniversity | null>;
}

export default IUniversityMapper;
