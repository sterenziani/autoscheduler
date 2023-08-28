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

export class CourseClassController {
    private courseService: CourseService;
    private courseClassService: CourseClassService;

    constructor() {
        this.courseService = CourseService.getInstance();
        this.courseClassService = CourseClassService.getInstance();
    }

    public getCourseClass: RequestHandler = async (req, res, next) => {
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId);
            const course: Course = await courseClass.getCourse();
            const term: Term = await courseClass.getTerm();
            res.status(HTTP_STATUS.OK).send(CourseClassDto.courseClassToDto(courseClass, course.id, term.id));
        } catch (e) {
            next(e);
        }
    };

    public getLectures: RequestHandler = async (req, res, next) => {
        const courseClassId = req.params.courseClassId;

        try {
            const courseClass: CourseClass = await this.courseClassService.getCourseClass(courseClassId);
            const lectures: Lecture[] = await courseClass.getLectures();
            const lecturesWithBuilding: { lecture: Lecture; building: Building }[] = await Promise.all(
                lectures.map(async (l) => {
                    return {
                        lecture: l,
                        building: await l.getBuilding(),
                    };
                }),
            );
            res.status(HTTP_STATUS.OK).send(
                lecturesWithBuilding.map((lwb) => CourseClassDto.lectureToDto(lwb.lecture, lwb.building.id)),
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

        try {
            const courseClass: CourseClass = await this.courseClassService.modifyCourseClass(
                courseClassId,
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
}
