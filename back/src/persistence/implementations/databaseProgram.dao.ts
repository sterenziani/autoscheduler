import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { deglobalizeField, getNode, getRelId, globalizeField, graphDriver, parseErrors } from '../../helpers/persistence/graphPersistence.helper';
import Program from '../../models/abstract/program.model';
import DatabaseProgram from '../../models/implementations/databaseProgram.model';
import ProgramDao from '../abstract/program.dao';
import {v4 as uuidv4} from 'uuid';

const BELONGS_TO_PREFIX = 'PU';

export default class DatabaseProgramDao extends ProgramDao {
    private static instance: ProgramDao;

    static getInstance = () => {
        if (!DatabaseProgramDao.instance) {
            DatabaseProgramDao.instance = new DatabaseProgramDao();
        }
        return DatabaseProgramDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT program_id_unique_constraint IF NOT EXISTS FOR (p: Program) REQUIRE p.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT program_internal_id_unique_constraint IF NOT EXISTS FOR (p: Program) REQUIRE p.internalId IS UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[BuildingDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, internalId: string, name: string): Promise<Program> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (p: Program {id: $id, internalId: $internalId, name: $name})-[:BELONGS_TO {relId: $relId}]->(u) RETURN p',
                {universityId, id, internalId, name, relId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToProgram(node);
        } catch (err) {
            throw parseErrors(err, '[ProgramDao:create]', ERRORS.BAD_REQUEST.PROGRAM_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    private nodeToProgram(node: any): DatabaseProgram {
        return new DatabaseProgram(node.id, deglobalizeField(node.internalId), node.name);
    }
}
