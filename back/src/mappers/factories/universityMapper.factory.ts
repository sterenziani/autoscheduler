import { PERSISTENCE } from '../../constants/persistence/persistence.contants';
import GenericMapperFactory from './genericMapper.factory';
import MemoryUniversityMapper from '../implementations/memoryUniversity.mapper';

class UniversityMapperFactory extends GenericMapperFactory {
    protected static readonly mapperName = 'UniversityMapper';

    // TODO: implement University Mapper for DB & replace
    protected static readonly mappers = {
        [PERSISTENCE.DATABASE]: MemoryUniversityMapper,
        [PERSISTENCE.MEMORY]: MemoryUniversityMapper,
    };
}

export default UniversityMapperFactory;
