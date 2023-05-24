import ProgramService from '../services/program.service';
import { RequestHandler } from 'express';
import Program from '../models/abstract/program.model';
import University from '../models/abstract/university.model';
import { HTTP_STATUS } from '../constants/http.constants';
import * as ProgramDto from '../dtos/program.dto';

export class ProgramController {
    private programService: ProgramService;

    constructor() {
        this.programService = ProgramService.getInstance();
    }

    public getProgram: RequestHandler = async (req, res, next) => {
        const programId = req.params.programId;

        try {
            const program: Program = await this.programService.getProgram(programId);
            const university: University = await program.getUniversity();
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, university));
        } catch (e) {
            next(e);
        }
    };

    public createProgram: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const name = req.body.name as string;
        const internalId = req.body.internalId as string;
        const mandatoryCourses = req.body.mandatoryCourses as string[] | undefined;
        const optionalCourses = req.body.optionalCourses as string[] | undefined;

        try {
            const program: Program = await this.programService.createProgram(
                userInfo.id,
                name,
                internalId,
                mandatoryCourses,
                optionalCourses,
            );
            res.status(HTTP_STATUS.CREATED).location(ProgramDto.getProgramUrl(program.id)).send();
        } catch (e) {
            next(e);
        }
    };
}
