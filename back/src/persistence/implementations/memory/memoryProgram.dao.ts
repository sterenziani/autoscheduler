import { MEMORY_DATABASE } from '../../../constants/persistence/memoryPersistence.constants';
import { addChildToParent, paginateCollection } from '../../../helpers/persistence/memoryPersistence.helper';
import Program from '../../../models/abstract/program.model';
import MemoryProgram from '../../../models/implementations/memory/memoryProgram.model';
import ProgramDao from '../../abstract/program.dao';
import MemoryUniversityDao from './memoryUniversity.dao';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedCollection } from '../../../interfaces/paging.interface';

export default class MemoryProgramDao extends ProgramDao {
    private static instance: ProgramDao;

    static getInstance = () => {
        if (!MemoryProgramDao.instance) {
            MemoryProgramDao.instance = new MemoryProgramDao();
        }
        return MemoryProgramDao.instance;
    };

    // Abstract Methods Implementations
    public async create(universityId: string, internalId: string, name: string): Promise<Program> {
        // We get the university to check that it exists
        const university = await MemoryUniversityDao.getInstance().getById(universityId);
        const newProgram = new MemoryProgram(uuidv4(), internalId, name);

        // We need to save the program and the relationship with the university
        MEMORY_DATABASE.programs.set(newProgram.id, newProgram);
        addChildToParent(MEMORY_DATABASE.programsOfUniversity, university.id, newProgram.id);

        return newProgram;
    }

    public async findById(id: string): Promise<Program | undefined> {
        return MEMORY_DATABASE.programs.get(id);
    }

    public async findByInternalId(universityId: string, internalId: string): Promise<Program | undefined> {
        // find programs with matching internalId
        const programsWithMatchingInternalId: Program[] = Array.from(MEMORY_DATABASE.programs.values()).filter(
            (p) => p.internalId == internalId,
        );
        // find university with matching obtained id
        for (const program of programsWithMatchingInternalId) {
            const university = await program.getUniversity();
            if (university.id == universityId) return program;
        }
        return undefined;
    }

    public async set(program: Program): Promise<void> {
        await this.getById(program.id);

        if (!(program instanceof MemoryProgram))
            program = new MemoryProgram(program.id, program.internalId, program.name);

        MEMORY_DATABASE.programs.set(program.id, program);
    }

    public async findByText(
        universityId: string,
        text?: string,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedCollection<Program>> {
        text = text ? text.toLowerCase() : text;
        const programs: Program[] = [];

        for (const program of MEMORY_DATABASE.programs.values()) {
            const university = await program.getUniversity();
            if (university.id != universityId) continue;
            if (!text || program.name.toLowerCase().includes(text) || program.internalId.toLowerCase().includes(text)) {
                programs.push(program);
            }
        }

        // sorting by internalId
        const comparePrograms = (p1: Program, p2: Program) => {
            if (p1.internalId < p2.internalId) return -1;
            if (p1.internalId > p2.internalId) return 1;
            return 0;
        };

        return paginateCollection(programs, comparePrograms, limit, offset);
    }
}
