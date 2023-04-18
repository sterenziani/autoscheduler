import { RequestHandler } from 'express';
import * as UserDto from '../dtos/user.dto';
import * as StudentDto from '../dtos/student.dto';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserService from '../services/user.service';
import CourseService from '../services/course.service';
import { courseToDto } from '../dtos/course.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import { modelArrayToDtoArray } from '../helpers/collection.helper';
import StudentService from '../services/student.service';
import { ROLE } from '../constants/general.constants';
import Student from '../models/abstract/student.model';
import User from '../models/abstract/user.model';

export class StudentController {
    private courseService: CourseService;
    private userService: UserService;
    private studentService: StudentService;

    constructor() {
        this.courseService = CourseService.getInstance();
        this.userService = UserService.getInstance();
        this.studentService = StudentService.getInstance();
    }

    public getActiveStudent: RequestHandler = async (req, res) => {
        res.redirect(UserDto.getUrl(req.user.id, ROLE.STUDENT));
    };

    public getStudent: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const user: User = await this.userService.getUser(userId);
            const student: Student = await this.studentService.getStudent(userId);
            res.status(HTTP_STATUS.OK).send(StudentDto.toDto(user, student));
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
