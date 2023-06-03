import { RequestHandler } from 'express';
import * as CourseDto from '../dtos/course.dto';
import * as ProgramDto from '../dtos/program.dto';
import * as UserDto from '../dtos/user.dto';
import * as UniversityDto from '../dtos/university.dto';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserService from '../services/user.service';
import CourseService from '../services/course.service';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { ROLE } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import { getUserUrl } from '../dtos/user.dto';
import { getUniversitiesUrl } from '../dtos/university.dto';
import ProgramService from '../services/program.service';

export class UniversityController {
    private courseService: CourseService;
    private programService: ProgramService;
    private universityService: UniversityService;
    private userService: UserService;

    constructor() {
        this.courseService = CourseService.getInstance();
        this.programService = ProgramService.getInstance();
        this.universityService = UniversityService.getInstance();
        this.userService = UserService.getInstance();
    }

    public getActiveUniversity: RequestHandler = async (req, res) => {
        res.redirect(UserDto.getUserUrl(req.user.id, ROLE.UNIVERSITY));
    };

    public getUniversity: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;

        try {
            const university: University = await this.universityService.getUniversity(userId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university));
        } catch (e) {
            next(e);
        }
    };

    public createUniversity: RequestHandler = async (req, res, next) => {
        const email = req.body.email as string;
        const password = req.body.password as string;
        const name = req.body.name as string;

        try {
            const university: University = await this.universityService.createUniversity(email, password, name);
            res.status(HTTP_STATUS.CREATED).location(getUserUrl(university.id, ROLE.UNIVERSITY)).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversities: RequestHandler = async (req, res, next) => {
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const universities = await this.universityService.getUniversitiesByText(filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(universities.pagingInfo)) {
                links[key] = getUniversitiesUrl(filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(universities.collection.map((u) => UniversityDto.universityToDto(u)));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourses: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const courses = await this.courseService.getCoursesByText(userInfo.id, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(courses.pagingInfo)) {
                links[key] = UniversityDto.getUniversityCoursesUrl(userInfo.id, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(courses.collection.map((c) => CourseDto.courseToDto(c, userInfo.id)));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityPrograms: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const programs = await this.programService.getProgramsByText(userInfo.id, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(programs.pagingInfo)) {
                links[key] = UniversityDto.getUniversityProgramsUrl(userInfo.id, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(programs.collection.map((p) => ProgramDto.programToDto(p, userInfo.id)));
        } catch (e) {
            next(e);
        }
    };
}
