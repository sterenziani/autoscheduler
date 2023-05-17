import { RequestHandler } from 'express';
import * as UserDto from '../dtos/user.dto';
import * as UniversityDto from '../dtos/university.dto';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserService from '../services/user.service';
import CourseService from '../services/course.service';
import { HTTP_STATUS } from '../constants/http.constants';
import UniversityService from '../services/university.service';
import { ROLE } from '../constants/general.constants';
import University from '../models/abstract/university.model';
import User from '../models/abstract/user.model';

export class UniversityController {
    private courseService: CourseService;
    private userService: UserService;
    private universityService: UniversityService;

    constructor() {
        this.courseService = CourseService.getInstance();
        this.userService = UserService.getInstance();
        this.universityService = UniversityService.getInstance();
    }

    public getActiveUniversity: RequestHandler = async (req, res) => {
        res.redirect(UserDto.getUserUrl(req.user.id, ROLE.UNIVERSITY));
    };

    public getUniversity: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const user: User = await this.userService.getUser(userId);
            const university: University = await this.universityService.getUniversity(userId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(user, university));
        } catch (e) {
            next(e);
        }
    };
}
