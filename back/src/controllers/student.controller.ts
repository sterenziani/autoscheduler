import { RequestHandler } from 'express';
import * as StudentDto from '../dtos/student.dto';
import * as UniversityDto from '../dtos/university.dto';
import * as ProgramDto from '../dtos/program.dto';
import * as CourseDto from '../dtos/course.dto';
import * as CourseClassDto from '../dtos/courseClass.dto';
import * as BuildingDto from '../dtos/building.dto';
import * as LectureDto from '../dtos/lecture.dto';
import * as TermDto from '../dtos/term.dto';
import * as ScheduleDto from '../dtos/schedule.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidName, isValidTimes, validateArray, validateBoolean, validateDate, validateElemOrElemArray, validateInt, validateString, validateTimes } from '../helpers/validation.helper';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import Program from '../models/abstract/program.model';
import ProgramService from '../services/program.service';
import { getReqPath, getResourceUrl } from '../helpers/url.helper';
import Course from '../models/abstract/course.model';
import CourseService from '../services/course.service';
import CourseClassService from '../services/courseClass.service';
import CourseClass from '../models/abstract/courseClass.model';
import BuildingService from '../services/building.service';
import Building from '../models/abstract/building.model';
import LectureService from '../services/lecture.service';
import Lecture from '../models/abstract/lecture.model';
import { IBuildingDistance } from '../interfaces/building.interface';
import Term from '../models/abstract/term.model';
import TermService from '../services/term.service';
import StudentService from '../services/student.service';
import Student from '../models/abstract/student.model';
import { removeDuplicates } from '../helpers/collection.helper';
import { DEFAULT_PRIORITIZE_UNLOCKS, DEFAULT_REDUCE_DAYS, DEFAULT_TARGET_HOURS } from '../constants/schedule.constants';
import ScheduleService from '../services/schedule.service';
import { IScheduleWithScore } from '../interfaces/schedule.interface';

export class StudentController {
    private universityService: UniversityService;
    private programService: ProgramService;
    private courseService: CourseService;
    private courseClassService: CourseClassService;
    private buildingService: BuildingService;
    private lectureService: LectureService;
    private termService: TermService;
    private studentService: StudentService;
    private schedulesService: ScheduleService;

    constructor() {
        this.universityService = UniversityService.getInstance();
        this.programService = ProgramService.getInstance();
        this.courseService = CourseService.getInstance();
        this.courseClassService = CourseClassService.getInstance();
        this.buildingService = BuildingService.getInstance();
        this.lectureService = LectureService.getInstance();
        this.termService = TermService.getInstance();
        this.studentService = StudentService.getInstance();
        this.schedulesService = ScheduleService.getInstance();
    }

    public getStudent: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;

        try {
            const student: Student = await this.studentService.getStudent(studentId);
            res.status(HTTP_STATUS.OK).send(StudentDto.studentToDto(student, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public createStudentForExistingUser: RequestHandler = async (req, res, next) => {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const userLocale = req.user.locale;
        const name = validateString(req.body.name);
        const universityId = validateString(req.body.universityId);
        const programId = validateString(req.body.programId);

        if (!name || !universityId || !programId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const student: Student = await this.studentService.createStudentExistingUser(userId, userEmail, userLocale, name, universityId, programId);
            res.status(HTTP_STATUS.CREATED)
                .location(getResourceUrl(RESOURCES.STUDENT, API_SCOPE.STUDENT, student.id))
                .send(StudentDto.studentToDto(student, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public modifyStudent: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const name = validateString(req.body.name);

        if (!name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const student: Student = await this.studentService.modifyStudent(studentId, undefined, name);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.STUDENT, API_SCOPE.STUDENT, student.id))
                .send(StudentDto.studentToDto(student, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversity: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role

        try {
            const university: University = await this.universityService.getUniversity(universityId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityPrograms: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedPrograms: PaginatedCollection<Program> = await this.programService.getPrograms(page, limit, filter, universityId);
            res.status(HTTP_STATUS.OK)
                .links(ProgramDto.paginatedProgramsToLinks(paginatedPrograms, getReqPath(req), limit, filter))
                .send(ProgramDto.paginatedProgramsToDto(paginatedPrograms, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const programId = req.params.programId;

        try {
            const program: Program = await this.programService.getProgram(programId, universityId);
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityProgramRemainingCourses: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const programId = req.params.programId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const optional = validateBoolean(req.query.optional);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getRemainingCourses(page, limit, studentId, programId, universityId, filter, optional);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityProgramCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const programId = req.params.programId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const optional = validateBoolean(req.query.optional);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getCourses(page, limit, filter, programId, optional, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityProgramCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const programId = req.params.programId;
        const courseId = req.params.courseId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getRequiredCourses(page, limit, courseId, filter, programId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const optional = validateBoolean(req.query.optional);
        const programId = validateString(req.query.programId);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getCourses(page, limit, filter, programId, optional, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional, programId))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseId = req.params.courseId;

        try {
            const course: Course = await this.courseService.getCourse(courseId, universityId);
            res.status(HTTP_STATUS.OK).send(CourseDto.courseToDto(course, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseId = req.params.courseId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const termId = validateString(req.query.termId);

        try {
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, termId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    // Duplicate
    public getStudentUniversityCourseCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseId = req.params.courseId;
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId, universityId, courseId);
            res.status(HTTP_STATUS.OK).send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseId = req.params.courseId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const programId = validateString(req.query.programId);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getRequiredCourses(page, limit, courseId, filter, programId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, undefined, programId))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuildings: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedBuildings: PaginatedCollection<Building> = await this.buildingService.getBuildings(page, limit, filter, universityId);
            res.status(HTTP_STATUS.OK)
                .links(BuildingDto.paginatedBuildingsToLinks(paginatedBuildings, getReqPath(req), limit, filter))
                .send(BuildingDto.paginatedBuildingsToDto(paginatedBuildings, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuilding: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const buildingId = req.params.buildingId;

        try {
            const building: Building = await this.buildingService.getBuilding(buildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.buildingToDto(building, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuildingLectures: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
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
                .send(LectureDto.paginatedLecturesToDto(paginatedLectures, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuildingDistances: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const buildingId = req.params.buildingId;

        try {
            const distances: IBuildingDistance[] = await this.buildingService.getDistances(buildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.distancesToDto(distances, API_SCOPE.STUDENT, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuildingDistance: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const buildingId = req.params.buildingId;
        const distancedBuildingId = req.params.distancedBuildingId;

        try {
            const distance: IBuildingDistance = await this.buildingService.getDistance(buildingId, distancedBuildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.distanceToDto(distance, API_SCOPE.STUDENT, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityTerms: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const from = validateDate(req.query.from);
        const to = validateDate(req.query.to);
        const published = validateBoolean(req.query.published);

        if (from && to && to < from) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_FROM_AND_TO));

        try {
            const paginatedTerms: PaginatedCollection<Term> = await this.termService.getTerms(page, limit, filter, from, to, published, universityId);
            res.status(HTTP_STATUS.OK)
                .links(TermDto.paginatedTermsToLinks(paginatedTerms, getReqPath(req), limit, filter, from, to, published))
                .send(TermDto.paginatedTermsToDto(paginatedTerms, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityTerm: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const termId = req.params.termId;

        try {
            const term: Term = await this.termService.getTerm(termId, universityId);
            res.status(HTTP_STATUS.OK).send(TermDto.termToDto(term, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityTermCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const termId = req.params.termId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const courseId = validateString(req.query.courseId);

        try {
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, undefined, courseId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const courseId = validateString(req.query.courseId);
        const termId = validateString(req.query.termId);

        try {
            const paginatedCourseClasses: PaginatedCollection<CourseClass> = await this.courseClassService.getCourseClasses(page, limit, filter, courseId, termId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseClassDto.paginatedCourseClassesToLinks(paginatedCourseClasses, getReqPath(req), limit, filter, termId, courseId))
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId, universityId);
            res.status(HTTP_STATUS.OK).send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseClassLectures: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
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
                .send(LectureDto.paginatedLecturesToDto(paginatedLectures, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseClassLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseClassId = req.params.courseClassId;
        const lectureId = req.params.lectureId;

        try {
            const lecture: Lecture = await this.lectureService.getLecture(lectureId, universityId, courseClassId);
            res.status(HTTP_STATUS.OK).send(LectureDto.lectureToDto(lecture, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const lectureId = req.params.lectureId;

        try {
            const lecture: Lecture = await this.lectureService.getLecture(lectureId, universityId);
            res.status(HTTP_STATUS.OK).send(LectureDto.lectureToDto(lecture, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentProgram: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const programId = req.user.programId!;          // Can assert only for user with student role

        try {
            const program: Program = await this.programService.getProgram(programId, universityId);
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public modifyStudentProgram: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const oldProgramId = req.user.programId!;       // Can assert only for user with student role
        const programId = validateString(req.body.programId);

        if (!programId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            // If it's the same program we just pretend we did what was asked
            if (programId != oldProgramId)
                await this.studentService.modifyStudent(studentId, programId);
            // TODO: Create a temporary map between current authorization and new programId so we don't require student to login again
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getStudentProgramRemainingCourses: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const programId = req.user.programId!;          // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const optional = validateBoolean(req.query.optional);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getRemainingCourses(page, limit, studentId, programId, universityId, filter, optional);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const optional = validateBoolean(req.query.optional);
        const programId = validateString(req.query.programId);

        try {
            const paginatedCourses: PaginatedCollection<Course> = await this.courseService.getCompletedCourses(page, limit, studentId, filter, optional, programId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(CourseDto.paginatedCoursesToLinks(paginatedCourses, getReqPath(req), limit, filter, optional, programId))
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public addStudentCompletedCourse: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseId = validateString(req.body.courseId);

        if (!courseId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            await this.studentService.addCompletedCourse(studentId, universityId, courseId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public removeStudentCompletedCourse: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseId = req.params.courseId;

        try {
            await this.studentService.removeCompletedCourse(studentId, universityId, courseId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkAddStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseIds = removeDuplicates(validateArray(req.body.courseIds, validateString) ?? []);

        if (courseIds.length === 0) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));

        try {
            await this.studentService.bulkAddCompletedCourses(studentId, universityId, courseIds);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public bulkReplaceStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!;    // Can assert only for user with student role
        const courseIds = removeDuplicates(validateArray(req.body.courseIds, validateString) ?? []);

        try {
            await this.studentService.bulkReplaceCompletedCourses(studentId, universityId, courseIds);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getStudentSchedules: RequestHandler = async (req, res, next) => {
        const studentId = req.user.id;
        const universityId = req.user.universityId!     // Can assert only for user with student role
        const programId = req.user.programId!           // Can assert only for user with student role
        const termId = validateString(req.query.termId);
        const hours = validateInt(req.query.hours) ?? DEFAULT_TARGET_HOURS;
        const reduceDays = validateBoolean(req.query.reduceDays) ?? DEFAULT_REDUCE_DAYS;
        const prioritizeUnlocks = validateBoolean(req.query.prioritizeUnlocks) ?? DEFAULT_PRIORITIZE_UNLOCKS;
        const unavailableTimesStrings = validateElemOrElemArray(req.query.unavailable, validateString);
        const unavailableTimes = validateTimes(unavailableTimesStrings) ?? [];

        if (!termId) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidTimes(unavailableTimes, true)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIMES));

        try {
            const schedules: IScheduleWithScore[] = await this.schedulesService.getSchedules(studentId, universityId, programId, termId, hours, reduceDays, prioritizeUnlocks, unavailableTimes);
            res.status(HTTP_STATUS.OK).send(ScheduleDto.schedulesToDto(schedules))
        } catch (e) {
            next(e);
        }
    };
}
