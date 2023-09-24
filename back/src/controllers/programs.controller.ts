import ProgramService from '../services/program.service';
import { RequestHandler } from 'express';
import Program from '../models/abstract/program.model';
import { HTTP_STATUS } from '../constants/http.constants';
import * as ProgramDto from '../dtos/program.dto';
import { API_SCOPE } from '../constants/general.constants';

export class ProgramsController {
    private programService: ProgramService;

    constructor() {
        this.programService = ProgramService.getInstance();
    }

    public getProgram: RequestHandler = async (req, res, next) => {
        const programId = req.params.programId;

        try {
            const program: Program = await this.programService.getProgram(programId);
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, API_SCOPE.ROOT))
        } catch (e) {
            next(e);
        }
    };
}
