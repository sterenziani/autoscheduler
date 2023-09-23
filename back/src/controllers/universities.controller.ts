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
import { API_SCOPE, ROLE } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import { getUserUrl } from '../dtos/user.dto';
import { getUniversitiesUrl } from '../dtos/university.dto';
import ProgramService from '../services/program.service';
import BuildingService from '../services/building.service';
import { IBuildingDistance } from '../interfaces/building.interface';
import Building from '../models/abstract/building.model';
import TermService from '../services/term.service';
import { getDateFromISO, isValidISODate } from '../helpers/time.helper';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';
import { isValidName } from '../helpers/validation.helper';

export class UniversitiesController {
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

    public getUniversity: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;

        try {
            const university: University = await this.universityService.getUniversity(userId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityForExistingUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const userLocale = req.user.locale;
        const name = req.body.name as string;

        if (!name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const university: University = await this.universityService.createUniversityExistingUser(userId, userEmail, userLocale, name);
            res.status(HTTP_STATUS.CREATED).location(UniversityDto.getUniversityPath(API_SCOPE.UNIVERSITY, university.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversities: RequestHandler = async (req, res, next) => {
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        try {
            const universities = await this.universityService.getUniversitiesByText(per_page, page, filter);
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

    public getUniversityUser: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;

        try {
            const user = await this.userService.getUser(universityId);  // This is possible because user and university share an id
            res.status(HTTP_STATUS.OK).send(UserDto.userToDto(user));
        } catch (e) {
            next(e)
        }
    };

    public getUniversityCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        try {
            const courses = await this.courseService.getCoursesByText(universityId, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(courses.pagingInfo)) {
                links[key] = UniversityDto.getUniversityCoursesUrl(universityId, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(courses.collection.map((c) => CourseDto.courseToDto(c, universityId)));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityPrograms: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        try {
            const programs = await this.programService.getProgramsByText(universityId, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(programs.pagingInfo)) {
                links[key] = UniversityDto.getUniversityProgramsUrl(universityId, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(programs.collection.map((p) => ProgramDto.programToDto(p, universityId)));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuildings: RequestHandler = async (req, res, next) => {
        const universityId = req.params.universityId;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        try {
            const buildings = await this.buildingService.getUniversityBuildingsByText(universityId, per_page, page, filter);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(buildings.pagingInfo)) {
                links[key] = UniversityDto.getUniversityBuildingsUrl(universityId, filter, value, per_page);
            }
            const buildingsWithDistances: { building: Building; distances: IBuildingDistance[] }[] =
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
        const universityId = req.params.universityId;
        const filter = req.query.filter as string | undefined;
        const published = req.query.published as boolean | undefined;
        const from = req.query.from as string | undefined;
        const to = req.query.to as string | undefined;
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        if ((from && !isValidISODate(from)) || (to && !isValidISODate(to)))
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const realPublished = userInfo?.id === universityId ? published : true;
            const fromDate = from ? getDateFromISO(from) : undefined;
            const toDate = to ? getDateFromISO(to) : undefined;
            const terms = await this.termService.getTerms(
                universityId,
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
                    universityId,
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
        const universityId = req.params.universityId;
        const newVerifiedStatus = (req.body.verified === 'true');

        try {
            const university: University = await this.universityService.setUniversityVerificationStatus(universityId, newVerifiedStatus);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university));
        } catch (e) {
            next(e);
        }
    };
}
