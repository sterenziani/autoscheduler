import CourseService from '../services/course.service';
import CourseClassService from '../services/courseClass.service';
import { RequestHandler } from 'express';
import Course from '../models/abstract/course.model';
import { HTTP_STATUS } from '../constants/http.constants';
import * as CourseClassDto from '../dtos/courseClass.dto';
import CourseClass from '../models/abstract/courseClass.model';
import Term from '../models/abstract/term.model';
import { validateArray, validateLecture } from '../helpers/validation.helper';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import Lecture from '../models/abstract/lecture.model';
import Building from '../models/abstract/building.model';
import LectureService from '../services/lecture.service';

export class LectureController {
    private lectureService: LectureService;

    constructor() {
        this.lectureService = LectureService.getInstance();
    }

    public getLectures: RequestHandler = async (req, res, next) => {
        const page = parseInt(req.query.page as string) ?? 1;
        const per_page = parseInt(req.query.per_page as string) ?? DEFAULT_PAGE_SIZE;

        try {
            const lectures = await this.lectureService.getLectures(per_page, page);
            res.status(HTTP_STATUS.OK).send(LecturesDto.courseClassToDto(courseClass, course.id, term.id));
        } catch (e) {
            next(e);
        }
    };

    public getLecture: RequestHandler = async (req, res, next) => {
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId);
            const lectures: Lecture[] = await courseClass.getLectures();
            const lecturesWithBuilding: { lecture: Lecture; building: Building|undefined }[] = await Promise.all(
                lectures.map(async (l) => {
                    return {
                        lecture: l,
                        building: await l.getBuilding(),
                    };
                }),
            );
            res.status(HTTP_STATUS.OK).send(
                lecturesWithBuilding.map((lwb) => CourseClassDto.lectureToDto(lwb.lecture, lwb.building?lwb.building.id:undefined)),
            );
        } catch (e) {
            next(e);
        }
    };

    public createCourseClass: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const courseId = req.body.courseId;
        const termId = req.body.termId;
        const name = req.body.name as string;
        const lectures = validateArray(req.body.lectures, validateLecture);

        if (!courseId || !termId || !name || !lectures)
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            const courseClass: CourseClass = await this.courseClassService.createCourseClass(
                userInfo.id,
                courseId,
                termId,
                name,
                lectures,
            );
            res.status(HTTP_STATUS.CREATED).send(CourseClassDto.courseClassToDto(courseClass, courseId, termId));
        } catch (e) {
            next(e);
        }
    };

    public updateCourseClass: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const courseClassId = req.params.courseClassId;
        const courseId = req.body.courseId;
        const termId = req.body.termId;
        const name = req.body.name as string | undefined;
        const lectures = validateArray(req.body.lectures, validateLecture);

        if (!courseId || !termId || !name || !lectures)
            return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_PARAMS));

        try {
            await this.verifyOwnership(courseClassId, userInfo.id);
            const courseClass: CourseClass = await this.courseClassService.modifyCourseClass(
                courseClassId,
                courseId,
                termId,
                name,
                lectures,
            );
            res.status(HTTP_STATUS.CREATED).send(CourseClassDto.courseClassToDto(courseClass, courseId, termId));
        } catch (e) {
            next(e);
        }
    };

    public deleteCourseClass: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const courseClassId = req.params.courseClassId;

        try {
            await this.verifyOwnership(courseClassId, userInfo.id);
            await this.courseClassService.deleteCourseClass(courseClassId);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };

    private verifyOwnership = async (courseClassId: string, userId: string) => {
        const courseClass = await this.courseClassService.getCourseClass(courseClassId);
        const course = await courseClass.getCourse();
        const courseUniversity = await course.getUniversity();
        if (courseUniversity.id !== userId) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);
    }
}
