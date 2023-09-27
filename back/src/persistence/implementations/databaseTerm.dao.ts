import { ERRORS } from '../../constants/error.constants';
import GenericException from '../../exceptions/generic.exception';
import { deglobalizeField, getNode, getRelId, globalizeField, graphDriver, parseErrors, parseGraphDate, toGraphDate } from '../../helpers/persistence/graphPersistence.helper';
import { decodeText, encodeText } from '../../helpers/string.helper';
import Term from '../../models/abstract/term.model';
import DatabaseTerm from '../../models/implementations/databaseTerm.model';
import TermDao from '../abstract/term.dao';
import {v4 as uuidv4} from 'uuid';

const BELONGS_TO_PREFIX = 'T-U';

export default class DatabaseTermDao extends TermDao {
    private static instance: TermDao;

    static getInstance = () => {
        if (!DatabaseTermDao.instance) {
            DatabaseTermDao.instance = new DatabaseTermDao();
        }
        return DatabaseTermDao.instance;
    };

    // Abstract Methods Implementations
    async init(): Promise<void> {
        const session = graphDriver.session();
        try {
            const promises: Promise<any>[] = [];
            // Constraints
            promises.push(session.run(
                'CREATE CONSTRAINT term_id_unique_constraint IF NOT EXISTS FOR (t: Term) REQUIRE t.id IS UNIQUE'
            ));
            promises.push(session.run(
                'CREATE CONSTRAINT term_internal_id_unique_constraint IF NOT EXISTS FOR (t: Term) REQUIRE t.internalId IS UNIQUE'
            ));
            // Indexes
            promises.push(session.run(
                'CREATE TEXT INDEX term_name_text_index IF NOT EXISTS FOR (t: Term) ON (t.name)'
            ));
            await Promise.allSettled(promises);
        } catch (err) {
            console.log(`[TermDao] Warning: Failed to create constraints and indexes. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }

    async create(universityId: string, internalId: string, name: string, startDate: Date, published: boolean): Promise<Term> {
        // Generate a new id
        const id = uuidv4();

        const session = graphDriver.session();
        try {
            const encodedName = encodeText(name);
            internalId = globalizeField(universityId, internalId);
            const relId = getRelId(BELONGS_TO_PREFIX, id, universityId);
            const result = await session.run(
                'MATCH (u: University {id: $universityId}) CREATE (t: Term {id: $id, internalId: $internalId, name: $name, encoding: $encoding, startDate: $startDate, published: $published})-[:BELONGS_TO {relId: $relId}]->(u) RETURN t',
                {universityId, id, internalId, name: encodedName.cleanText, encoding: encodedName.encoding, startDate: toGraphDate(startDate), published, relId}
            );
            const node = getNode(result);
            if (!node) throw new GenericException(ERRORS.NOT_FOUND.UNIVERSITY);
            return this.nodeToTerm(node);
        } catch (err) {
            throw parseErrors(err, '[TermDao:create]', ERRORS.BAD_REQUEST.TERM_ALREADY_EXISTS);
        } finally {
            await session.close();
        }
    }

    private nodeToTerm(node: any): DatabaseTerm {
        return new DatabaseTerm(node.id, deglobalizeField(node.internalId), decodeText(node.name, node.encoding), node.published, parseGraphDate(node.startDate));
    }
}
