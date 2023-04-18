import { PERSISTENCE } from '../../constants/persistence/persistence.contants';

abstract class GenericMapperFactory {
    protected static readonly mappers: { [p: string]: any };
    protected static readonly mapperName: string;

    static get() {
        const persistence: PERSISTENCE = process.env.PERSISTENCE! as PERSISTENCE;
        const maybeMapper = this.mappers[persistence];
        if (maybeMapper === undefined) throw Error(`${this.mapperName} not implemented for key '${persistence}'`);
        return maybeMapper.getInstance();
    }
}

export default GenericMapperFactory;
