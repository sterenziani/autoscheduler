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
import { getUserUrl } from '../dtos/user.dto';

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

        try {
            const university: University = await this.universityService.getUniversity(userId);
            res.status(HTTP_STATUS.OK).send(UniversityDto.universityToDto(university));
        } catch (e) {
            next(e);
        }
    };

    public createUniversity: RequestHandler = async (req, res, next) => {
        const email = req.body.email as string;
        const password = req.body.password as string;
        const name = req.body.name as string;

        try {
            const university: University = await this.universityService.createUniversity(email, password, name);
            res.status(HTTP_STATUS.CREATED).location(getUserUrl(university.id, ROLE.UNIVERSITY)).send();
        } catch (e) {
            next(e);
        }
    };
}
