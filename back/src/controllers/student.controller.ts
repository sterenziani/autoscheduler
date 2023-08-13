import { RequestHandler } from 'express';
import * as UserDto from '../dtos/user.dto';
import * as StudentDto from '../dtos/student.dto';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserService from '../services/user.service';
import { HTTP_STATUS } from '../constants/http.constants';
import StudentService from '../services/student.service';
import { ROLE } from '../constants/general.constants';
import Student from '../models/abstract/student.model';
import University from '../models/abstract/university.model';
import Program from '../models/abstract/program.model';
import Course from '../models/abstract/course.model';
import { courseToDto } from '../dtos/course.dto';
import { getUserUrl } from '../dtos/user.dto';

export class StudentController {
    private userService: UserService;
    private studentService: StudentService;

    constructor() {
        this.userService = UserService.getInstance();
        this.studentService = StudentService.getInstance();
    }

    public getActiveStudent: RequestHandler = async (req, res) => {
        res.redirect(UserDto.getUserUrl(req.user.id, ROLE.STUDENT));
    };

    public getStudent: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const student: Student = await this.studentService.getStudent(userId);
            const university: University = await student.getUniversity();
            const program: Program = await student.getProgram();
            res.status(HTTP_STATUS.OK).send(StudentDto.studentToDto(student, university, program));
        } catch (e) {
            next(e);
        }
    };

    public createStudent: RequestHandler = async (req, res, next) => {
        const email = req.body.email as string;
        const password = req.body.password as string;
        const universityId = req.body.universityId as string;
        const programId = req.body.programId as string;
        const internalId = req.body.internalId as string;
        const name = req.body.name as string;

        try {
            const student: Student = await this.studentService.createStudent(
                email,
                password,
                universityId,
                programId,
                internalId,
                name,
            );
            res.status(HTTP_STATUS.CREATED).location(getUserUrl(student.id, ROLE.STUDENT)).send();
        } catch (e) {
            next(e);
        }
    };

    public getStudentCompletedCourses: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;
        const userInfo = req.user;

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            const approvedCourses: Course[] = await this.studentService.getStudentCompletedCourses(userId);
            // getting courses with their respective universities, see if we can cache universities
            const coursesWithUniversity: { course: Course; university: University }[] = await Promise.all(
                approvedCourses.map(async (course) => {
                    return { course, university: await course.getUniversity() };
                }),
            );
            res.status(HTTP_STATUS.OK).send(
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

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

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

        if (userId !== userInfo.id) throw new GenericException(ERRORS.FORBIDDEN.GENERAL);

        try {
            await this.studentService.removeStudentCompletedCourses(userInfo.id, completedCourses);
            res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (e) {
            next(e);
        }
    };
}
