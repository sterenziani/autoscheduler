import { RequestHandler } from 'express';
import * as BuildingDto from '../dtos/building.dto';
import * as CourseDto from '../dtos/course.dto';
import * as ProgramDto from '../dtos/program.dto';
import * as TermDto from '../dtos/term.dto';
import * as UserDto from '../dtos/user.dto';
import * as UniversityDto from '../dtos/university.dto';
import UserService from '../services/user.service';
import CourseService from '../services/course.service';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { ROLE } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import { getUserUrl } from '../dtos/user.dto';
import { getUniversitiesUrl } from '../dtos/university.dto';
import ProgramService from '../services/program.service';
import BuildingService from '../services/building.service';
import { IDistanceToBuilding } from '../interfaces/building.interface';
import Building from '../models/abstract/building.model';
import TermService from '../services/term.service';
import { getDateFromISO, isValidISODate } from '../helpers/time.helper';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';

export class UniversityController {
    private buildingService: BuildingService;
    private courseService: CourseService;
    private termService: TermService;
    private programService: ProgramService;
    private universityService: UniversityService;
    private userService: UserService;

    constructor() {
        this.buildingService = BuildingService.getInstance();
        this.courseService = CourseService.getInstance();
        this.termService = TermService.getInstance();
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
        const locale = req.headers['accept-language'];

        try {
            const university: University = await this.universityService.createUniversity(email, password, name, locale);
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
        const userId = req.params.userId;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const courses = await this.courseService.getCoursesByText(userId, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(courses.pagingInfo)) {
                links[key] = UniversityDto.getUniversityCoursesUrl(userId, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(courses.collection.map((c) => CourseDto.courseToDto(c, userId)));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityPrograms: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const programs = await this.programService.getProgramsByText(userId, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(programs.pagingInfo)) {
                links[key] = UniversityDto.getUniversityProgramsUrl(userId, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(programs.collection.map((p) => ProgramDto.programToDto(p, userId)));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuildings: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const buildings = await this.buildingService.getUniversityBuildingsByText(userId, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(buildings.pagingInfo)) {
                links[key] = UniversityDto.getUniversityBuildingsUrl(userId, filter, value, per_page);
            }
            const buildingsWithDistances: { building: Building; distances: IDistanceToBuilding[] }[] =
                await Promise.all(
                    buildings.collection.map(async (b) => {
                        return { building: b, distances: await this.buildingService.getBuildingDistances(b.id) };
                    }),
                );

            res.status(HTTP_STATUS.OK).links(links).send(
                buildingsWithDistances.map((bwd) => BuildingDto.buildingToDto(bwd.building, bwd.distances)),
            );
        } catch (e) {
            next(e);
        }
    };

    public getUniversityTerms: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const userId = req.params.userId;
        const filter = req.query.filter as string | undefined;
        const published = req.query.published as boolean | undefined;
        const from = req.query.from as string | undefined;
        const to = req.query.to as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        if ((from && !isValidISODate(from)) || (to && !isValidISODate(to)))
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const realPublished = userInfo?.id === userId ? published : true;
            const fromDate = from ? getDateFromISO(from) : undefined;
            const toDate = to ? getDateFromISO(to) : undefined;
            const terms = await this.termService.getTerms(
                userId,
                filter,
                realPublished,
                fromDate,
                toDate,
                per_page,
                page,
            );
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(terms.pagingInfo)) {
                links[key] = UniversityDto.getUniversityTermsUrl(
                    userId,
                    filter,
                    realPublished,
                    fromDate,
                    toDate,
                    value,
                    per_page,
                );
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(terms.collection.map((t) => TermDto.termToDto(t)));
        } catch (e) {
            next(e);
        }
    };

    public editUniversityVerificationStatus: RequestHandler = async (req, res, next) => {
        const universityId = req.params.userId;
        const newVerifiedStatus = (req.body.verified === 'true');

        try {
            const university: University = await this.universityService.setUniversityVerificationStatus(universityId, newVerifiedStatus);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university));
        } catch (e) {
            next(e);
        }
    };
}
