import { ERRORS } from '../../constants/error.constants';
import Program from '../../models/abstract/program.model';
import GenericDao from './generic.dao';

export default abstract class ProgramDao extends GenericDao<Program> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.PROGRAM);
    }

    // Abstract Methods
    public abstract create(universityId: string, internalId: string, name: string): Promise<Program>;
}
