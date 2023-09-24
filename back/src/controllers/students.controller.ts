import { RequestHandler } from 'express';
import * as StudentDto from '../dtos/student.dto';
import { HTTP_STATUS } from '../constants/http.constants';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { isValidName, validateInt, validateString } from '../helpers/validation.helper';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { getReqPath, getResourceUrl } from '../helpers/url.helper';
import StudentService from '../services/student.service';
import Student from '../models/abstract/student.model';

export class StudentsController {
    private studentService: StudentService;

    constructor() {
        this.studentService = StudentService.getInstance();
    }

    public getStudentsForAdmin: RequestHandler = async (req, res, next) => {
        const page = validateInt(req.query.page) ?? 1;
        const limit = validateInt(req.query.limit ?? req.query.per_page) ?? DEFAULT_PAGE_SIZE;
        const filter = validateString(req.query.filter);

        try {
            const paginatedStudents: PaginatedCollection<Student> = await this.studentService.getStudents(page, limit, filter);
            res.status(HTTP_STATUS.OK)
                .links(StudentDto.paginatedStudentsToLinks(paginatedStudents, getReqPath(req), limit, filter))
                .send(StudentDto.paginatedStudentsToDto(paginatedStudents, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public getStudentForAdmin: RequestHandler = async (req, res, next) => {
        const studentId = req.params.studentId;

        try {
            const student: Student = await this.studentService.getStudent(studentId);
            res.status(HTTP_STATUS.OK).send(StudentDto.studentToDto(student, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };

    public modifyStudentForAdmin: RequestHandler = async (req, res, next) => {
        const studentId = req.params.studentId;
        const name = validateString(req.body.name);

        if (!name) return next(new GenericException(ERRORS.BAD_REQUEST.MISSING_PARAMS));
        if (!isValidName(name)) return next(new GenericException(ERRORS.BAD_REQUEST.INVALID_NAME));

        try {
            const student: Student = await this.studentService.modifyStudent(studentId, undefined, name);
            res.status(HTTP_STATUS.OK)
                .location(getResourceUrl(RESOURCES.STUDENT, API_SCOPE.ROOT, student.id))
                .send(StudentDto.studentToDto(student, API_SCOPE.ROOT));
        } catch (e) {
            next(e);
        }
    };
}
