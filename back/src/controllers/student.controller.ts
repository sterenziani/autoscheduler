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
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidDay, isValidInternalId, isValidName, isValidTimeOfDay, isValidTimeRange, isValidTimes, validateArray, validateBoolean, validateBuildingDistances, validateDate, validateElemOrElemArray, validateInt, validateString } from '../helpers/validation.helper';
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
import ScheduleService from '../services/schedule.service';
import { ISchedule } from '../interfaces/schedule.interface';

export class StudentController {
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

    public getActiveStudent: RequestHandler = async (req, res) => {
        res.redirect(UserDto.getUserUrl(req.user.id, ROLE.STUDENT));
    };

    // TODO: createStudentForExistingUser
    // TODO: modifyStudent

    public getStudentUniversity: RequestHandler = async (req, res) => {
        const universityId = req.user.universityId;

        try {
            const university: University = await this.universityService.getUniversity(universityId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };



    public getStudentUniversityPrograms: RequestHandler = async (req, res) => {
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
        const programId = req.params.programId;

        try {
            const program: Program = await this.programService.getProgram(programId, universityId);
            res.status(HTTP_STATUS.OK).send(ProgramDto.programToDto(program, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityProgramCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityProgramCourseRequiredCourses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
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
                .send(CourseDto.paginatedCoursesToDto(paginatedCourses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourse: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
        const courseId = req.params.courseId;

        try {
            const course: Course = await this.courseService.getCourse(courseId, universityId);
            res.status(HTTP_STATUS.OK).send(CourseDto.courseToDto(course, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
                .send(CourseClassDto.paginatedCourseClassesToDto(paginatedCourseClasses, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseCourseClass: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
        const buildingId = req.params.buildingId;

        try {
            const building: Building = await this.buildingService.getBuilding(buildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.buildingToDto(building, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };


    public getStudentUniversityBuildingLectures: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
                .send(LectureDto.paginatedLecturesToDto(paginatedLectures, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuildingDistances: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
        const buildingId = req.params.buildingId;

        try {
            const distances: IBuildingDistance[] = await this.buildingService.getDistances(buildingId, universityId);
            res.status(HTTP_STATUS.OK).send(BuildingDto.distancesToDto(distances, API_SCOPE.STUDENT, buildingId));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityBuildingDistance: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);
        const startDate = validateDate(req.query.startDate);
        const published = validateBoolean(req.query.published);

        try {
            const paginatedTerms: PaginatedCollection<Term> = await this.termService.getTerms(page, limit, filter, startDate, published, universityId);
            res.status(HTTP_STATUS.OK)
                .links(TermDto.paginatedTermsToLinks(paginatedTerms, getReqPath(req), limit, filter, startDate, published))
                .send(TermDto.paginatedTermsToDto(paginatedTerms, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityTerm: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
        const termId = req.params.termId;

        try {
            const term: Term = await this.termService.getTerm(termId, universityId);
            res.status(HTTP_STATUS.OK).send(TermDto.termToDto(term, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityTermCourseClasses: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId, universityId);
            res.status(HTTP_STATUS.OK).send(CourseClassDto.courseClassToDto(courseClass, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseClassLectures: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
        const courseClassId = req.params.courseClassId;
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const time = validateElemOrElemArray(req.query.time, validateString);
        const buildingId = validateString(req.query.buildingId);

        if (time && !isValidTimes(time)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_TIMES));

        try {
            const paginatedLectures: PaginatedCollection<Lecture> = await this.lectureService.getLectures(page, limit, time, courseClassId, buildingId, universityId);
            res.status(HTTP_STATUS.OK)
                .links(LectureDto.paginatedLecturesToLinks(paginatedLectures, getReqPath(req), limit, time, buildingId))
                .send(LectureDto.paginatedLecturesToDto(paginatedLectures, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentUniversityCourseClassLecture: RequestHandler = async (req, res, next) => {
        const universityId = req.user.universityId;
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
        const universityId = req.user.universityId;
        const lectureId = req.params.lectureId;

        try {
            const lecture: Lecture = await this.lectureService.getLecture(lectureId, universityId);
            res.status(HTTP_STATUS.OK).send(LectureDto.lectureToDto(lecture, API_SCOPE.STUDENT));
        } catch (e) {
            next(e);
        }
    };



    // TODO: getStudentProgram
    // TODO: modifyStudentProgram

    // TODO: getStudentRemainingCourses
    // TODO: getStudentCompletedCourses
    // TODO: addStudentCompletedCourse
    // TODO: bulkAddStudentCompletedCourses
    // TODO: bulkReplaceStudentCompletedCourses
    // TODO: addStudentCompletedCourse

    // TODO: getSchedules


    // Old endpoints:
/*
    public getStudent: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) return next(new GenericException(ERRORS.FORBIDDEN.GENERAL));

        try {
            const student: Student = await this.studentService.getStudent(userId);
            const university: University = await student.getUniversity();
            const program: Program | undefined = await student.getProgram();
            res.status(HTTP_STATUS.OK).send(StudentDto.studentToDto(student, university, program));
        } catch (e) {
            next(e);
        }
    };

    public createStudent: RequestHandler = async (req, res, next) => {
        const email = req.body.email as string;
        const password = req.body.password as string;
        const programId = req.body.programId as string;
        const name = req.body.name as string;
        const locale = req.headers['accept-language'];

        if (!email || !password || !name || !programId) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const student: Student = await this.studentService.createStudent(
                email,
                password,
                programId,
                name,
                locale??"en"
            );
            res.status(HTTP_STATUS.CREATED).location(getUserUrl(student.id, ROLE.STUDENT)).send();
        } catch (e) {
            next(e);
        }
    };

    public getStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        if (userId !== userInfo.id) return next(new GenericException(ERRORS.FORBIDDEN.GENERAL));

        try {
            const completedCourses = await this.studentService.getStudentCompletedCourses(userId, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(completedCourses.pagingInfo)) {
                links[key] = StudentDto.getCompletedCoursesUrl(userId, value, per_page);
            }

            // getting courses with their respective universities, see if we can cache universities
            const coursesWithUniversity: { course: Course; university: University }[] = await Promise.all(
                completedCourses.collection.map(async (course) => {
                    return { course, university: await course.getUniversity() };
                }),
            );
            res.status(HTTP_STATUS.OK).links(links).send(
                coursesWithUniversity.map((cwu) => courseToDto(cwu.course, cwu.university.id)),
            );
        } catch (e) {
            next(e);
        }
    };

    public getStudentRemainingCourses: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const programId = req.params.programId;
        const userInfo = req.user;

        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const remainingCourses = await this.studentService.getStudentRemainingCoursesForProgram(userId, programId, filter, per_page, page);
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(remainingCourses.pagingInfo)) {
                links[key] = StudentDto.getRemainingCoursesUrl(userId, programId, value, per_page);
            }

            // getting courses with their respective universities, see if we can cache universities
            const coursesWithUniversity: { course: Course; university: University }[] = await Promise.all(
                remainingCourses.collection.map(async (course) => {
                    return { course, university: await course.getUniversity() };
                }),
            );
            res.status(HTTP_STATUS.OK).links(links).send(
                coursesWithUniversity.map((cwu) => courseToDto(cwu.course, cwu.university.id)),
            );
        } catch (e) {
            next(e);
        }
    };

    public addStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;
        const completedCourses = req.body.courseIds as string[];

        if (userId !== userInfo.id) return next(new GenericException(ERRORS.FORBIDDEN.GENERAL));

        try {
            await this.studentService.addStudentCompletedCourses(userInfo.id, completedCourses);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public removeStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;
        const completedCourses = req.body.courseIds as string[];

        if (userId !== userInfo.id) return next(new GenericException(ERRORS.FORBIDDEN.GENERAL));

        try {
            await this.studentService.removeStudentCompletedCourses(userInfo.id, completedCourses);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    public getStudentSchedules: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;

        const programId = req.query.programId as string;
        const termId = req.query.termId as string;
        const targetHours = Number(req.query.hours);
        const reduceDays = (req.query.reduceDays === 'true');
        const prioritizeUnlocks = (req.query.prioritizeUnlocks === 'true');

        const unavailableArray = req.query.unavailable ? (Array.isArray(req.query.unavailable) ? req.query.unavailable : [req.query.unavailable]) : [];
        const unavailableTimeSlots = validateArray(unavailableArray, validateUnavailableTime);

        if (!programId || !termId || !targetHours || !unavailableTimeSlots)
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const schedules: {schedule:ISchedule, score:number}[] = await this.scheduleService.getSchedules(
                userId,
                programId,
                termId,
                targetHours,
                reduceDays,
                prioritizeUnlocks,
                unavailableTimeSlots
            );
            const scheduleDtos = schedules.map(s => scheduleToDto(s.schedule, s.score));
            res.status(HTTP_STATUS.OK).send(scheduleDtos);
        } catch (e) {
            next(e);
        }
    };
    */
}
