import { PERSISTENCE } from '../../constants/persistence.contants';
import GenericMapperFactory from './genericMapper.factory';
import MemoryCourseMapper from '../implementations/memoryCourse.mapper';

class UserMapperFactory extends GenericMapperFactory {
    protected static readonly mapperName = 'StudentMapper';

    // TODO: implement Course Mapper for DB & replace
    protected static readonly mappers = {
        [PERSISTENCE.DATABASE]: MemoryCourseMapper,
        [PERSISTENCE.MEMORY]: MemoryCourseMapper,
    };
}

export default UserMapperFactory;
