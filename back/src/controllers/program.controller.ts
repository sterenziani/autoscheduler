import ProgramService from '../services/program.service';
import { RequestHandler } from 'express';
import Program from '../models/abstract/program.model';
import University from '../models/abstract/university.model';
import { HTTP_STATUS } from '../constants/http.constants';
import * as ProgramDto from '../dtos/program.dto';
import * as CourseDto from '../dtos/course.dto';

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
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, university.id));
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
                internalId,
                name,
                mandatoryCourses,
                optionalCourses,
            );
            res.status(HTTP_STATUS.CREATED).location(ProgramDto.getProgramUrl(program.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public updateProgram: RequestHandler = async (req, res, next) => {
        const programId = req.params.programId;
        const userInfo = req.user;

        const name = req.body.name as string;
        const internalId = req.body.internalId as string;
        const mandatoryCourses = req.body.mandatoryCourses as string[] | undefined;
        const optionalCourses = req.body.optionalCourses as string[] | undefined;

        try {
            const program: Program = await this.programService.updateProgram(
                programId,
                internalId,
                name,
                mandatoryCourses,
                optionalCourses,
            );
            res.status(HTTP_STATUS.OK).location(ProgramDto.getProgramUrl(program.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public getProgramMandatoryCourses: RequestHandler = async (req, res, next) => {
        const programId = req.params.programId;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const program: Program = await this.programService.getProgram(programId);
            const university: University = await program.getUniversity();
            const courses = await this.programService.getProgramMandatoryCourses(programId, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(courses.pagingInfo)) {
                links[key] = ProgramDto.getProgramMandatoryCoursesUrl(programId, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(courses.collection.map((p) => CourseDto.courseToDto(p, university.id)));
        } catch (e) {
            next(e);
        }
    };

    public getProgramOptionalCourses: RequestHandler = async (req, res, next) => {
        const programId = req.params.programId;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const program: Program = await this.programService.getProgram(programId);
            const university: University = await program.getUniversity();
            const courses = await this.programService.getProgramOptionalCourses(programId, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(courses.pagingInfo)) {
                links[key] = ProgramDto.getProgramOptionalCoursesUrl(programId, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(courses.collection.map((p) => CourseDto.courseToDto(p, university.id)));
        } catch (e) {
            next(e);
        }
    };
}
