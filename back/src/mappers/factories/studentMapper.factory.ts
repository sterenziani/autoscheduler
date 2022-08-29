import { PERSISTENCE } from '../../constants/persistence.contants';
import MemoryStudentMapper from '../implementations/memoryStudent.mapper';
import GenericMapperFactory from './genericMapper.factory';

class StudentMapperFactory extends GenericMapperFactory {
    protected static readonly mapperName = 'StudentMapper';

    // TODO: implement Student Mapper for DB & replace
    protected static readonly mappers = {
        [PERSISTENCE.DATABASE]: MemoryStudentMapper,
        [PERSISTENCE.MEMORY]: MemoryStudentMapper,
    };
}

export default StudentMapperFactory;
