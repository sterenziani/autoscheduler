import { RequestHandler } from 'express';
import * as UniversityDto from '../dtos/university.dto';
import * as ProgramDto from '../dtos/program.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';
import { isValidFilter, isValidName, validateBoolean, validateInt, validateString } from '../helpers/validation.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { getReqPath, getResourceUrl } from '../helpers/url.helper';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import ProgramService from '../services/program.service';
import Program from '../models/abstract/program.model';

export class UniversitiesController {
    private universityService: UniversityService;
    private programService: ProgramService;

    constructor() {
        this.universityService = UniversityService.getInstance();
        this.programService = ProgramService.getInstance();
    }

    public getUniversities: RequestHandler = async (req, res, next) => {
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const verified = validateBoolean(req.query.verified);

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
            const paginatedUniversities: PaginatedCollection<University> = await this.universityService.getUniversities(page, limit, filter, verified);
            res.status(HTTP_STATUS.OK)
                .links(UniversityDto.paginatedUniversitiesToLinks(paginatedUniversities, getReqPath(req), limit, filter, verified))
                .send(UniversityDto.paginatedUniversitiesToDto(paginatedUniversities, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public getUniversity: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;

        try {
            const university: University = await this.universityService.getUniversity(universityId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityForAdmin: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;
        const name = validateString(req.body.name);
        const verified = validateBoolean(req.body.verified);

        if (!name && verified === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const university: University = await this.universityService.modifyUniversity(universityId, name, verified);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.UNIVERSITY, API_SCOPE.ROOT, university.id))
                .send(UniversityDto.universityToDto(university, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityPrograms: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
            const paginatedPrograms: PaginatedCollection<Program> = await this.programService.getPrograms(page, limit, filter, universityId);
            res.status(HTTP_STATUS.OK)
                .links(ProgramDto.paginatedProgramsToLinks(paginatedPrograms, getReqPath(req), limit, filter))
                .send(ProgramDto.paginatedProgramsToDto(paginatedPrograms, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;
        const programId = req.params.programId;

        try {
            const program: Program = await this.programService.getProgram(programId, universityId);
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };
}
