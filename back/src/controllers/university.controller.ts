import { RequestHandler } from 'express';
import * as UniversityDto from '../dtos/university.dto';
import * as ProgramDto from '../dtos/program.dto';
import * as CourseDto from '../dtos/course.dto';
import * as CourseClassDto from '../dtos/courseClass.dto';
import * as BuildingDto from '../dtos/building.dto';
import * as LectureDto from '../dtos/lecture.dto';
import * as TermDto from '../dtos/term.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidInternalId, isValidName, isValidTimes, validateArray, validateBoolean, validateBuildingDistances, validateDate, validateElemOrElemArray, validateInt, validateString } from '../helpers/validation.helper';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import Program from '../models/abstract/program.model';
import ProgramService from '../services/program.service';
import { getReqPath, getResourceUrl } from '../helpers/url.helper';
import Course from '../models/abstract/course.model';
import CourseService from '../services/course.service';
import { removeDuplicates, valuesIntersect } from '../helpers/collection.helper';
import CourseClassService from '../services/courseClass.service';
import CourseClass from '../models/abstract/courseClass.model';
import BuildingService from '../services/building.service';
import Building from '../models/abstract/building.model';
import LectureService from '../services/lecture.service';
import Lecture from '../models/abstract/lecture.model';
import { IBuildingDistance } from '../interfaces/building.interface';
import Term from '../models/abstract/term.model';
import TermService from '../services/term.service';

export class UniversityController {
    private universityService: UniversityService;
    private programService: ProgramService;
    private courseService: CourseService;
    private courseClassService: CourseClassService;
    private buildingService: BuildingService;
    private lectureService: LectureService;
    private termService: TermService;

    constructor() {
        this.universityService = UniversityService.getInstance();
        this.programService = ProgramService.getInstance();
        this.courseService = CourseService.getInstance();
        this.courseClassService = CourseClassService.getInstance();
        this.buildingService = BuildingService.getInstance();
        this.lectureService = LectureService.getInstance();
        this.termService = TermService.getInstance();
    }

    public getUniversity: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;

        try {
            const university: University = await this.universityService.getUniversity(universityId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityForExistingUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const userLocale = req.user.locale;
        const name = validateString(req.body.name);

        if (!name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const university: University = await this.universityService.createUniversityExistingUser(userId, userEmail, userLocale, name);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.UNIVERSITY, API_SCOPE.UNIVERSITY, university.id))
                .send(UniversityDto.universityToDto(university, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversity: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const name = validateString(req.body.name);
        
        if (!name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const university: University = await this.universityService.modifyUniversity(universityId, name);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.UNIVERSITY, API_SCOPE.UNIVERSITY, university.id))
                .send(UniversityDto.universityToDto(university, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityPrograms: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedPrograms: PaginatedCollection<Program> = await this.programService.getPrograms(page, limit, filter, universityId);
            res.status(HTTP_STATUS.OK)
                .links(ProgramDto.paginatedProgramsToLinks(paginatedPrograms, getReqPath(req), limit, filter))
                .send(ProgramDto.paginatedProgramsToDto(paginatedPrograms, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;

        try {
            const program: Program = await this.programService.getProgram(programId, universityId);
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);

        if (!internalId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const program: Program = await this.programService.createProgram(universityId, internalId, name);

            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.PROGRAM, API_SCOPE.UNIVERSITY, program.id))
                .send(ProgramDto.programToDto(program, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);

        if (!internalId && !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const program: Program = await this.programService.modifyProgram(programId, universityId, internalId, name);

            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.PROGRAM, API_SCOPE.UNIVERSITY, program.id))
                .send(ProgramDto.programToDto(program, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public deleteUniversityProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;

        try {
            await this.programService.deleteProgram(programId, universityId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityProgramCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const optional = validateBoolean(req.query.optional);

        try {
            // TODO: Should i use programService when the return value is a Course? I can understand using program service when adding relationships, cuz those return void
            // TODO: but i feel like getters should still be handled by courseService
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getCourses(page, limit, filter, programId, optional, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public addUniversityProgramCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = validateString(req.body.courseId);
        const optional = validateBoolean(req.body.optional);

        if (!courseId || optional === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        
        try {
            await this.programService.addCourse(programId, universityId, courseId, optional);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityProgramCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const optional = validateBoolean(req.body.optional);

        if (optional === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        
        try {
            await this.programService.modifyCourse(programId, universityId, courseId, optional);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public removeUniversityProgramCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        
        try {
            await this.programService.removeCourse(programId, universityId, courseId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkAddUniversityProgramCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const mandatoryCourses = removeDuplicates(validateArray(req.body.mandatoryCourses, validateString) ?? []);
        const optionalCourses = removeDuplicates(validateArray(req.body.optionalCourses, validateString) ?? []);

        if (mandatoryCourses.length === 0 && optionalCourses.length === 0) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (valuesIntersect(mandatoryCourses, optionalCourses)) return next(new GenericException(ERRORS.BAD_REQUEST.COURSES_INTERSECT));

        try {
            await this.programService.bulkAddCourses(programId, universityId, mandatoryCourses, optionalCourses);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkReplaceUniversityProgramCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const mandatoryCourses = removeDuplicates(validateArray(req.body.mandatoryCourses, validateString) ?? []);
        const optionalCourses = removeDuplicates(validateArray(req.body.optionalCourses, validateString) ?? []);

        if (valuesIntersect(mandatoryCourses, optionalCourses)) return next(new GenericException(ERRORS.BAD_REQUEST.COURSES_INTERSECT));

        try {
            await this.programService.bulkReplaceCourses(programId, universityId, mandatoryCourses, optionalCourses);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityProgramCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getRequiredCourses(page, limit, courseId, filter, programId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public addUniversityProgramCourseRequiredCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const requiredCourseId = validateString(req.body.courseId);

        if (!requiredCourseId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            await this.programService.addCourseRequiredCourse(programId, universityId, courseId, requiredCourseId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public removeUniversityProgramCourseRequiredCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const requiredCourseId = req.params.requiredCourseId;

        try {
            await this.programService.removeCourseRequiredCourse(programId, universityId, courseId, requiredCourseId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkAddUniversityProgramCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const requirements = removeDuplicates(validateArray(req.body.requirements, validateString) ?? []);

        if (requirements.length === 0) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            await this.programService.bulkAddCourseRequiredCourses(programId, universityId, courseId, requirements);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkReplaceUniversityProgramCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const requirements = removeDuplicates(validateArray(req.body.requirements, validateString) ?? []);

        try {
            await this.programService.bulkReplaceCourseRequiredCourses(programId, universityId, courseId, requirements);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        let optional = validateBoolean(req.query.optional);
        const programId = validateString(req.query.programId);

        // Sanity check. If no programId provided, we have to ignore optional filter (or throw error)
        if (!programId) optional = undefined;

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getCourses(page, limit, filter, programId, optional, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional, programId))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;

        try {
            const course: Course = await this.courseService.getCourse(courseId, universityId);
            res.status(HTTP_STATUS.OK).send(CourseDto.courseToDto(course, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);
        
        if (!internalId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const course: Course = await this.courseService.createCourse(universityId, internalId, name);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.COURSE, API_SCOPE.UNIVERSITY, course.id))
                .send(CourseDto.courseToDto(course, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);
        
        if (!internalId && !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const course: Course = await this.courseService.modifyCourse(courseId, universityId, internalId, name);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.COURSE, API_SCOPE.UNIVERSITY, course.id))
                .send(CourseDto.courseToDto(course, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public deleteUniversityCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;

        try {
            await this.courseService.deleteCourse(courseId, universityId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourseCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const termId = validateString(req.query.termId);

        try {
            // TODO: Should i use courseService when the return value is a CourseClass? I can understand using course service when adding relationships, cuz those return void
            // TODO: but i feel like getters should still be handled by courseClassService
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, termId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    // Duplicate
    public getUniversityCourseCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId, universityId, courseId);
            res.status(HTTP_STATUS.OK).send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityCourseCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const termId = validateString(req.body.termId);
        const name = validateString(req.body.name);

        if (!termId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));
        
        try {
            // TODO: Should this be handled by courseService?
            const courseClass: CourseClass = await this.courseClassService.createCourseClass(universityId, courseId, termId, name);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.COURSE_CLASS, API_SCOPE.UNIVERSITY, courseClass.id))
                .send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    // Duplicate
    public modifyUniversityCourseCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const courseClassId = req.params.courseClassId;
        const termId = validateString(req.body.termId);
        const name = validateString(req.body.name);

        if (!termId && !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));
        
        try {
            const courseClass: CourseClass = await this.courseClassService.modifyCourseClass(courseClassId, universityId, courseId, termId, name);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.COURSE_CLASS, API_SCOPE.UNIVERSITY, courseClass.id))
                .send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    // Duplicate
    public deleteUniversityCourseCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const courseClassId = req.params.courseClassId;
        
        try {
            await this.courseClassService.deleteCourseClass(courseClassId, universityId, courseId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseId = req.params.courseId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const programId = validateString(req.query.programId);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getRequiredCourses(page, limit, courseId, filter, programId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, undefined, programId))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuildings: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedBuildings: PaginatedCollection<Building> = await this.buildingService.getBuildings(page, limit, filter, universityId);
            res.status(HTTP_STATUS.OK)
                .links(BuildingDto.paginatedBuildingsToLinks(paginatedBuildings, getReqPath(req), limit, filter))
                .send(BuildingDto.paginatedBuildingsToDto(paginatedBuildings, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuilding: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;

        try {
            const building: Building = await this.buildingService.getBuilding(buildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.buildingToDto(building, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityBuilding: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);
        
        if (!internalId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const building: Building = await this.buildingService.createBuilding(universityId, internalId, name);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.BUILDING, API_SCOPE.UNIVERSITY, building.id))    
                .send(BuildingDto.buildingToDto(building, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityBuilding: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);
        
        if (!internalId && !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const building: Building = await this.buildingService.modifyBuilding(buildingId, universityId, internalId, name);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.BUILDING, API_SCOPE.UNIVERSITY, building.id))    
                .send(BuildingDto.buildingToDto(building, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public deleteUniversityBuilding: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;

        try {
            await this.buildingService.deleteBuilding(buildingId, universityId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuildingLectures: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const time = validateElemOrElemArray(req.query.time, validateString);
        const courseClassId = validateString(req.query.courseClassId);

        if (time && !isValidTimes(time)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIMES));

        try {
            // TODO: Analyze if lectureService is correct
            const paginatedLectures: PaginatedCollection<Lecture> = await this.lectureService.getLectures(page, limit, time, courseClassId, buildingId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(LectureDto.paginatedLecturesToLinks(paginatedLectures, getReqPath(req), limit, time, undefined, courseClassId))
                .send(LectureDto.paginatedLecturesToDto(paginatedLectures, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuildingDistances: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;

        try {
            const distances: IBuildingDistance[] = await this.buildingService.getDistances(buildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.distancesToDto(distances, API_SCOPE.UNIVERSITY, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityBuildingDistance: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const distancedBuildingId = req.params.distancedBuildingId;

        try {
            const distance: IBuildingDistance = await this.buildingService.getDistance(buildingId, distancedBuildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.distanceToDto(distance, API_SCOPE.UNIVERSITY, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public addUniversityBuildingDistance: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const distancedBuildingId = validateString(req.body.buildingId);
        const distance = validateInt(req.body.distance);

        if (!distancedBuildingId || distance === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            const distanceToBuilding: IBuildingDistance = await this.buildingService.addDistance(buildingId, universityId, distancedBuildingId, distance);
            res.status(HTTP_STATUS.CREATED)
                .location(BuildingDto.getBuildingDistanceResourceUrl(buildingId, distancedBuildingId, API_SCOPE.UNIVERSITY))
                .send(BuildingDto.distanceToDto(distanceToBuilding, API_SCOPE.UNIVERSITY, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityBuildingDistance: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const distancedBuildingId = req.params.distancedBuildingId;
        const distance = validateInt(req.body.distance);

        if (distance === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            const distanceToBuilding: IBuildingDistance = await this.buildingService.modifyDistance(buildingId, universityId, distancedBuildingId, distance);
            res.status(HTTP_STATUS.OK)
                .location(BuildingDto.getBuildingDistanceResourceUrl(buildingId, distancedBuildingId, API_SCOPE.UNIVERSITY))
                .send(BuildingDto.distanceToDto(distanceToBuilding, API_SCOPE.UNIVERSITY, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public removeUniversityBuildingDistance: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const distancedBuildingId = req.params.distancedBuildingId;

        try {
            await this.buildingService.removeDistance(buildingId, universityId, distancedBuildingId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkAddUniversityBuildingDistances: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const distances = validateBuildingDistances(req.body.distances);

        if (!distances || Object.keys(distances).length === 0) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_BUILDING_DISTANCES));

        try {
            await this.buildingService.bulkAddDistances(buildingId, universityId, distances);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkReplaceUniversityBuildingDistances: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const buildingId = req.params.buildingId;
        const distances = validateBuildingDistances(req.body.distances) ?? {};

        try {
            await this.buildingService.bulkReplaceDistances(buildingId, universityId, distances);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityTerms: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const startDate = validateDate(req.query.startDate);
        const published = validateBoolean(req.query.published);

        try {
            const paginatedTerms: PaginatedCollection<Term> = await this.termService.getTerms(page, limit, filter, startDate, published, universityId);
            res.status(HTTP_STATUS.OK)
                .links(TermDto.paginatedTermsToLinks(paginatedTerms, getReqPath(req), limit, filter, startDate, published))
                .send(TermDto.paginatedTermsToDto(paginatedTerms, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityTerm: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const termId = req.params.termId;

        try {
            const term: Term = await this.termService.getTerm(termId, universityId);
            res.status(HTTP_STATUS.OK).send(TermDto.termToDto(term, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityTerm: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);
        const startDate = validateDate(req.body.startDate);
        const published = validateBoolean(req.body.published);

        if (!internalId || !name || !startDate || published === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const term: Term = await this.termService.createTerm(universityId, internalId, name, startDate, published);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.TERM, API_SCOPE.UNIVERSITY, term.id))
                .send(TermDto.termToDto(term, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityTerm: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const termId = req.params.termId;
        const internalId = validateString(req.body.internalId);
        const name = validateString(req.body.name);
        const startDate = validateDate(req.body.startDate);
        const published = validateBoolean(req.body.published);

        if (!internalId && !name && !startDate && published === undefined) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const term: Term = await this.termService.modifyTerm(termId, universityId, internalId, name, startDate, published);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.TERM, API_SCOPE.UNIVERSITY, term.id))
                .send(TermDto.termToDto(term, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public deleteUniversityTerm: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const termId = req.params.termId;

        try {
            await this.termService.deleteTerm(termId, universityId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityTermCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const termId = req.params.termId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const courseId = validateString(req.query.courseId);

        try {
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, undefined, courseId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    // public getUniversityCourses: RequestHandler = async (req, res, next) => {
    //     const universityId = req.params.universityId;
    //     const filter = req.query.filter as string | undefined;
    //     const page = parseInt(req.query.page as string) ?? 1;
    //     const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

    //     try {
    //         const courses = await this.courseService.getCoursesByText(universityId, filter, per_page, page);
    //         const links: Record<string, string> = {};
    //         for (const [key, value] of Object.entries(courses.pagingInfo)) {
    //             links[key] = UniversityDto.getUniversityCoursesUrl(universityId, filter, value, per_page);
    //         }
    //         res.status(HTTP_STATUS.OK)
    //             .links(links)
    //             .send(courses.collection.map((c) => CourseDto.courseToDto(c, universityId)));
    //     } catch (e) {
    //         next(e);
    //     }
    // };

    // public getUniversityPrograms: RequestHandler = async (req, res, next) => {
    //     const universityId = req.params.universityId;
    //     const filter = req.query.filter as string | undefined;
    //     const page = parseInt(req.query.page as string) ?? 1;
    //     const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

    //     try {
    //         const programs = await this.programService.getProgramsByText(universityId, filter, per_page, page);
    //         const links: Record<string, string> = {};
    //         for (const [key, value] of Object.entries(programs.pagingInfo)) {
    //             links[key] = UniversityDto.getUniversityProgramsUrl(universityId, filter, value, per_page);
    //         }
    //         res.status(HTTP_STATUS.OK)
    //             .links(links)
    //             .send(programs.collection.map((p) => ProgramDto.programToDto(p, universityId)));
    //     } catch (e) {
    //         next(e);
    //     }
    // };

    // public getUniversityBuildings: RequestHandler = async (req, res, next) => {
    //     const universityId = req.params.universityId;
    //     const filter = req.query.filter as string | undefined;
    //     const page = parseInt(req.query.page as string) ?? 1;
    //     const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

    //     try {
    //         const buildings = await this.buildingService.getUniversityBuildingsByText(universityId, per_page, page, filter);
    //         const links: Record<string, string> = {};
    //         for (const [key, value] of Object.entries(buildings.pagingInfo)) {
    //             links[key] = UniversityDto.getUniversityBuildingsUrl(universityId, filter, value, per_page);
    //         }
    //         const buildingsWithDistances: { building: Building; distances: IDistanceToBuilding[] }[] =
    //             await Promise.all(
    //                 buildings.collection.map(async (b) => {
    //                     return { building: b, distances: await this.buildingService.getBuildingDistances(b.id) };
    //                 }),
    //             );

    //         res.status(HTTP_STATUS.OK).links(links).send(
    //             buildingsWithDistances.map((bwd) => BuildingDto.buildingToDto(bwd.building, bwd.distances)),
    //         );
    //     } catch (e) {
    //         next(e);
    //     }
    // };

    // public getUniversityTerms: RequestHandler = async (req, res, next) => {
    //     const userInfo = req.user;
    //     const universityId = req.params.universityId;
    //     const filter = req.query.filter as string | undefined;
    //     const published = req.query.published as boolean | undefined;
    //     const from = req.query.from as string | undefined;
    //     const to = req.query.to as string | undefined;
    //     const page = parseInt(req.query.page as string) ?? 1;
    //     const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

    //     if ((from && !isValidISODate(from)) || (to && !isValidISODate(to)))
    //         return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

    //     try {
    //         const realPublished = userInfo?.id === universityId ? published : true;
    //         const fromDate = from ? getDateFromISO(from) : undefined;
    //         const toDate = to ? getDateFromISO(to) : undefined;
    //         const terms = await this.termService.getTerms(
    //             universityId,
    //             filter,
    //             realPublished,
    //             fromDate,
    //             toDate,
    //             per_page,
    //             page,
    //         );
    //         const links: Record<string, string> = {};
    //         for (const [key, value] of Object.entries(terms.pagingInfo)) {
    //             links[key] = UniversityDto.getUniversityTermsUrl(
    //                 universityId,
    //                 filter,
    //                 realPublished,
    //                 fromDate,
    //                 toDate,
    //                 value,
    //                 per_page,
    //             );
    //         }
    //         res.status(HTTP_STATUS.OK)
    //             .links(links)
    //             .send(terms.collection.map((t) => TermDto.termToDto(t)));
    //     } catch (e) {
    //         next(e);
    //     }
    // };

    // public editUniversityVerificationStatus: RequestHandler = async (req, res, next) => {
    //     const universityId = req.params.universityId;
    //     const newVerifiedStatus = (req.body.verified === 'true');

    //     try {
    //         const university: University = await this.universityService.setUniversityVerificationStatus(universityId, newVerifiedStatus);
    //         res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university));
    //     } catch (e) {
    //         next(e);
    //     }
    // };
}
