import { RequestHandler } from 'express';
import * as UserDto from '../dtos/user.dto';
import * as StudentDto from '../dtos/student.dto';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import UserService from '../services/user.service';
import ScheduleService from '../services/schedule.service';
import { HTTP_STATUS } from '../constants/http.constants';
import StudentService from '../services/student.service';
import { ROLE } from '../constants/general.constants';
import Student from '../models/abstract/student.model';
import University from '../models/abstract/university.model';
import Program from '../models/abstract/program.model';
import Course from '../models/abstract/course.model';
import { ISchedule } from '../interfaces/schedule.interface';
import { courseToDto } from '../dtos/course.dto';
import { scheduleToDto } from '../dtos/schedule.dto';
import { getUserUrl } from '../dtos/user.dto';
import { validateArray, validateUnavailableTime } from '../helpers/validation.helper';

export class StudentController {
    private userService: UserService;
    private scheduleService: ScheduleService;
    private studentService: StudentService;

    constructor() {
        this.userService = UserService.getInstance();
        this.scheduleService = ScheduleService.getInstance();
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

    public getSchedules: RequestHandler = async (req, res, next) => {
        const userId = req.params.userId;

        const programId = req.query.programId as string;
        const termId = req.query.termId as string;
        const targetHours = Number(req.query.hours);
        const reduceDays = (req.query.reduceDays === 'true');
        const prioritizeUnlocks = (req.query.prioritizeUnlocks === 'true');

        let unavailableTimeSlots;
        if(req.query.unavailable){
            if(Array.isArray(req.query.unavailable)){
                // Multiple items, pass as it is
                unavailableTimeSlots = validateArray(req.query.unavailable, validateUnavailableTime);
            } else{
                // 1 item, must convert to array
                unavailableTimeSlots = validateArray([req.query.unavailable], validateUnavailableTime);
            }
        } else {
            // Empty array
            unavailableTimeSlots = validateArray([], validateUnavailableTime);
        }

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
}
