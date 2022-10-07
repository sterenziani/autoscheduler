import { RequestHandler } from 'express';
import { getUserUrl, userToDto } from '../dtos/user.dto';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserService from '../services/user.service';
import { IUser } from '../models/user.model';
import CourseService from '../services/course.service';
import { courseToDto } from '../dtos/course.dto';
import {HTTP_STATUS} from "../constants/http.constants";
import {modelArrayToDtoArray} from "../helpers/collection.helper";

export class StudentController {
    private courseService: CourseService;
    private userService: UserService;

    constructor() {
        this.courseService = CourseService.getInstance();
        this.userService = UserService.getInstance();
    }

    public getActiveUser: RequestHandler = async (req, res) => {
        res.redirect(getUserUrl(req.user.id, req.user.role));
    };

    public getUser: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const user: IUser = await this.userService.getUser(userId);
            res.status(HTTP_STATUS.OK).send(userToDto(user));
        } catch (e) {
            next(e);
        }
    };

    public getStudentApprovedCourses: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const approvedCourses = await this.courseService.getStudentCompletedCourses(userId);
            res.status(HTTP_STATUS.OK).send(modelArrayToDtoArray(courseToDto, approvedCourses));
        } catch (e) {
            next(e);
        }
    };
}
