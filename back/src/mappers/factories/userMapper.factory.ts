import { PERSISTENCE } from '../../constants/persistence/persistence.contants';
import GenericMapperFactory from './genericMapper.factory';
import MemoryUserMapper from '../implementations/memoryUser.mapper';

class UserMapperFactory extends GenericMapperFactory {
    protected static readonly mapperName = 'UserMapper';

    // TODO: implement User Mapper for DB & replace
    protected static readonly mappers = {
        [PERSISTENCE.DATABASE]: MemoryUserMapper,
        [PERSISTENCE.MEMORY]: MemoryUserMapper,
    };
}

export default UserMapperFactory;
