import CourseService from '../services/course.service';
import { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants/http.constants';
import Course from '../models/abstract/course.model';
import University from '../models/abstract/university.model';
import * as CourseDto from '../dtos/course.dto';

export class CourseController {
    private courseService: CourseService;

    constructor() {
        this.courseService = CourseService.getInstance();
    }

    public getCourse: RequestHandler = async (req, res, next) => {
        const courseId = req.params.courseId;

        try {
            const course: Course = await this.courseService.getCourse(courseId);
            const university: University = await course.getUniversity();
            res.status(HTTP_STATUS.OK).send(CourseDto.courseToDto(course, university));
        } catch (e) {
            next(e);
        }
    };

    public createCourse: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const name = req.body.name as string;
        const internalId = req.body.internalId as string;
        const requirements = req.body.requirements as { [p: string]: string[] };

        try {
            const course: Course = await this.courseService.createCourse(userInfo.id, name, internalId, requirements);
            res.status(HTTP_STATUS.CREATED).location(CourseDto.getCourseUrl(course.id));
        } catch (e) {
            next(e);
        }
    };
}
