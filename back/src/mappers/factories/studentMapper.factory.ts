import { PERSISTENCE } from '../../constants/persistence.contants';
import GenericMapperFactory from './genericMapper.factory';
import MemoryStudentMapper from '../implementations/memoryStudent.mapper';

class StudentMapperFactory extends GenericMapperFactory {
    protected static readonly mapperName = 'StudentMapper';

    // TODO: implement Student Mapper for DB & replace
    protected static readonly mappers = {
        [PERSISTENCE.DATABASE]: MemoryStudentMapper,
        [PERSISTENCE.MEMORY]: MemoryStudentMapper,
    };
}

export default StudentMapperFactory;
