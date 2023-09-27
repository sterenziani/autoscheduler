import { RequestHandler } from 'express';
import * as UniversityDto from '../dtos/university.dto';
import * as ProgramDto from '../dtos/program.dto';
import * as CourseDto from '../dtos/course.dto';
import * as CourseClassDto from '../dtos/courseClass.dto';
import * as BuildingDto from '../dtos/building.dto';
import * as LectureDto from '../dtos/lecture.dto';
import * as TermDto from '../dtos/term.dto';
import * as StudentDto from '../dtos/student.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { API_SCOPE, DEFAULT_LOCALE, RESOURCES } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidDay, isValidEmail, isValidFilter, isValidInternalId, isValidName, isValidPassword, isValidTime, isValidTimeRange, isValidTimes, validateArray, validateBoolean, validateBuildingDistances, validateDate, validateElemOrElemArray, validateInt, validateLocale, validateString, validateTimes } from '../helpers/validation.helper';
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
import Student from '../models/abstract/student.model';
import StudentService from '../services/student.service';
import Time from '../helpers/classes/time.class';
import TimeRange from '../helpers/classes/timeRange.class';
import { DAY } from '../constants/time.constants';

export class UniversityController {
    private universityService: UniversityService;
    private programService: ProgramService;
    private courseService: CourseService;
    private courseClassService: CourseClassService;
    private buildingService: BuildingService;
    private lectureService: LectureService;
    private termService: TermService;
    private studentService: StudentService;

    constructor() {
        this.universityService = UniversityService.getInstance();
        this.programService = ProgramService.getInstance();
        this.courseService = CourseService.getInstance();
        this.courseClassService = CourseClassService.getInstance();
        this.buildingService = BuildingService.getInstance();
        this.lectureService = LectureService.getInstance();
        this.termService = TermService.getInstance();
        this.studentService = StudentService.getInstance();
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

    public createUniversity: RequestHandler = async (req, res, next) => {
        const email = validateString(req.body.email);
        const password = validateString(req.body.password);
        const locale = validateLocale(req.headers['accept-language']) ?? DEFAULT_LOCALE;
        const name = validateString(req.body.name);

        if (!email || !password || !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidEmail(email)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_EMAIL));
        if (!isValidPassword(password)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PASSWORD));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const university: University = await this.universityService.createUniversity(email, password, locale, name);
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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

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
        const optional = validateBoolean(req.query.optional);
        const programId = validateString(req.query.programId);

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
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
        const internalId = validateString(req.body.internalId);

        if (!termId || !name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        
        try {
            const courseClass: CourseClass = await this.courseClassService.createCourseClass(universityId, courseId, termId, name, internalId);
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
        const internalId = validateString(req.body.internalId);

        if (!termId && !name && !internalId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        
        try {
            const courseClass: CourseClass = await this.courseClassService.modifyCourseClass(courseClassId, universityId, courseId, termId, name, internalId);
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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

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
        const timesStrings = validateElemOrElemArray(req.query.times, validateString);
        const times = validateTimes(timesStrings);
        const courseClassId = validateString(req.query.courseClassId);

        if ((times && !isValidTimes(times)) || (timesStrings && !times)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIMES));

        try {
            const paginatedLectures: PaginatedCollection<Lecture> = await this.lectureService.getLectures(page, limit, times, courseClassId, buildingId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(LectureDto.paginatedLecturesToLinks(paginatedLectures, getReqPath(req), limit, timesStrings, undefined, courseClassId))
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
        const from = validateDate(req.query.from);
        const to = validateDate(req.query.to);
        const published = validateBoolean(req.query.published);

        if (from && to && to < from) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FROM_AND_TO));
        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
            const paginatedTerms: PaginatedCollection<Term> = await this.termService.getTerms(page, limit, filter, from, to, published, universityId);
            res.status(HTTP_STATUS.OK)
                .links(TermDto.paginatedTermsToLinks(paginatedTerms, getReqPath(req), limit, filter, from, to, published))
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

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, undefined, courseId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityStudents: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
            const paginatedStudents: PaginatedCollection<Student> = await this.studentService.getStudents(page, limit, filter, universityId);
            res.status(HTTP_STATUS.OK)
                .links(StudentDto.paginatedStudentsToLinks(paginatedStudents, getReqPath(req), limit, filter))
                .send(StudentDto.paginatedStudentsToDto(paginatedStudents, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityStudent: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const studentId = req.params.studentId;

        try {
            const student: Student = await this.studentService.getStudent(studentId, universityId);
            res.status(HTTP_STATUS.OK).send(StudentDto.studentToDto(student, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const courseId = validateString(req.query.courseId);
        const termId = validateString(req.query.termId);

        if (!isValidFilter(filter)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FILTER));

        try {
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, termId, courseId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId, universityId);
            res.status(HTTP_STATUS.OK).send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        const termId = validateString(req.body.termId);
        const name = validateString(req.body.name);
        const internalId = validateString(req.body.internalId);

        if (!termId && !name && !internalId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (name && !isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));
        if (internalId && !isValidInternalId(internalId)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_INTERNAL_ID));
        
        try {
            const courseClass: CourseClass = await this.courseClassService.modifyCourseClass(courseClassId, universityId, undefined, termId, name, internalId);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.COURSE_CLASS, API_SCOPE.UNIVERSITY, courseClass.id))
                .send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public deleteUniversityCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        
        try {
            await this.courseClassService.deleteCourseClass(courseClassId, universityId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourseClassLectures: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const timesStrings = validateElemOrElemArray(req.query.times, validateString);
        const times = validateTimes(timesStrings);
        const buildingId = validateString(req.query.buildingId);

        if ((times && !isValidTimes(times)) || (timesStrings && !times)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIMES));

        try {
            const paginatedLectures: PaginatedCollection<Lecture> = await this.lectureService.getLectures(page, limit, times, courseClassId, buildingId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(LectureDto.paginatedLecturesToLinks(paginatedLectures, getReqPath(req), limit, timesStrings, buildingId))
                .send(LectureDto.paginatedLecturesToDto(paginatedLectures, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public getUniversityCourseClassLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        const lectureId = req.params.lectureId;

        try {
            const lecture: Lecture = await this.lectureService.getLecture(lectureId, universityId, courseClassId);
            res.status(HTTP_STATUS.OK).send(LectureDto.lectureToDto(lecture, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public createUniversityCourseClassLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        const day = validateInt(req.body.day);
        const startTime = validateString(req.body.startTime);
        const endTime = validateString(req.body.endTime);
        const buildingId = validateString(req.body.buildingId);

        if (day === undefined || !startTime || !endTime || !buildingId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidDay(day)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_DAY));
        if (!isValidTime(startTime) || !isValidTime(endTime)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIME_OF_DAY));
        if (!isValidTimeRange(Time.fromString(startTime), Time.fromString(endTime))) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIME_RANGE));

        try {
            const timeRange: TimeRange = new TimeRange(day as DAY, Time.fromString(startTime), Time.fromString(endTime))
            const lecture: Lecture = await this.lectureService.createLecture(universityId, courseClassId, timeRange, buildingId);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.LECTURE, API_SCOPE.UNIVERSITY, lecture.id))
                .send(LectureDto.lectureToDto(lecture, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public modifyUniversityCourseClassLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        const lectureId = req.params.lectureId;
        const day = validateInt(req.body.day);
        const startTime = validateString(req.body.startTime);
        const endTime = validateString(req.body.endTime);
        const buildingId = validateString(req.body.buildingId);

        if ((day === undefined || !startTime || !endTime) && !buildingId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (day !== undefined && !isValidDay(day)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_DAY));
        if (startTime && endTime && (!isValidTime(startTime) || !isValidTime(endTime))) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIME_OF_DAY));
        if (startTime && endTime && !isValidTimeRange(Time.fromString(startTime), Time.fromString(endTime))) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIME_RANGE));

        try {
            const timeRange: TimeRange | undefined = (day !== undefined && startTime && endTime) ? new TimeRange(day as DAY, Time.fromString(startTime), Time.fromString(endTime)) : undefined;
            const lecture: Lecture = await this.lectureService.modifyLecture(lectureId, universityId, courseClassId, timeRange, buildingId);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.LECTURE, API_SCOPE.UNIVERSITY, lecture.id))
                .send(LectureDto.lectureToDto(lecture, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };

    public deleteUniversityCourseClassLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const courseClassId = req.params.courseClassId;
        const lectureId = req.params.lectureId;
        
        try {
            await this.lectureService.deleteLecture(lectureId, universityId, courseClassId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getUniversityLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.id;
        const lectureId = req.params.lectureId;

        try {
            const lecture: Lecture = await this.lectureService.getLecture(lectureId, universityId);
            res.status(HTTP_STATUS.OK).send(LectureDto.lectureToDto(lecture, API_SCOPE.UNIVERSITY));
        } catch (e) {
            next(e);
        }
    };
}
