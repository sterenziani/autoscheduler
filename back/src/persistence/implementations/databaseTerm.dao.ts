import { graphDriver } from '../../helpers/persistence/graphPersistence.helper';
import TermDao from '../abstract/term.dao';

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
            const constraintPromises: Promise<any>[] = [];
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT term_id_unique_constraint IF NOT EXISTS FOR (t: Term) REQUIRE t.id IS UNIQUE'
            ));
            constraintPromises.push(session.run(
                'CREATE CONSTRAINT term_internal_id_unique_constraint IF NOT EXISTS FOR (t: Term) REQUIRE t.internalId IS UNIQUE'
            ));
            await Promise.allSettled(constraintPromises);
        } catch (err) {
            console.log(`[TermDao] Warning: Failed to set constraints. Reason ${JSON.stringify(err)}`);
        } finally {
            await session.close();
        }
    }
}
