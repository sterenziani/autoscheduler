import TermService from '../services/term.service';
import { RequestHandler } from 'express';
import Term from '../models/abstract/term.model';
import { HTTP_STATUS } from '../constants/http.constants';
import * as TermDto from '../dtos/term.dto';
import { getDateFromISO, isValidISODate } from '../helpers/time.helper';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export class TermController {
    private termService: TermService;

    constructor() {
        this.termService = TermService.getInstance();
    }

    public getTerm: RequestHandler = async (req, res, next) => {
        const termId = req.params.termId;

        try {
            const term: Term = await this.termService.getTerm(termId);
            res.status(HTTP_STATUS.OK).send(TermDto.termToDto(term));
        } catch (e) {
            next(e);
        }
    };

    public createTerm: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const internalId = req.body.internalId as string | undefined;
        const name = req.body.name as string | undefined;
        const startDate = req.body.startDate as string | undefined;

        if (!internalId || !name || !(startDate && isValidISODate(startDate)))
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const term: Term = await this.termService.createTerm(
                userInfo.id,
                internalId,
                name,
                getDateFromISO(startDate),
            );
            res.status(HTTP_STATUS.CREATED).location(TermDto.getTermUrl(term.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public modifyTerm: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const termId = req.params.termId;
        const internalId = req.body.internalId as string | undefined;
        const name = req.body.name as string | undefined;
        const published = req.body.published as boolean | undefined;
        const startDate = req.body.startDate as string | undefined;

        if (!(startDate && isValidISODate(startDate)))
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const term: Term = await this.termService.modifyTerm(
                termId,
                userInfo.id,
                internalId,
                name,
                published,
                getDateFromISO(startDate),
            );
            res.status(HTTP_STATUS.NO_CONTENT).location(TermDto.getTermUrl(term.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public deleteTerm: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const termId = req.params.termId;

        try {
            await this.termService.deleteTerm(userInfo.id, termId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };
}
