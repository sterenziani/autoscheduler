import CourseService from '../services/course.service';
import { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants/http.constants';
import Course from '../models/abstract/course.model';
import University from '../models/abstract/university.model';
import * as CourseDto from '../dtos/course.dto';
import * as CourseClassDto from '../dtos/courseClass.dto';
import CourseClassService from '../services/courseClass.service';
import CourseClass from '../models/abstract/courseClass.model';
import Term from '../models/abstract/term.model';

export class CourseController {
    private courseService: CourseService;
    private courseClassService: CourseClassService;

    constructor() {
        this.courseService = CourseService.getInstance();
        this.courseClassService = CourseClassService.getInstance();
    }

    public getCourse: RequestHandler = async (req, res, next) => {
        const courseId = req.params.courseId;

        try {
            const course: Course = await this.courseService.getCourse(courseId);
            const university: University = await course.getUniversity();
            res.status(HTTP_STATUS.OK).send(CourseDto.courseToDto(course, university.id));
        } catch (e) {
            next(e);
        }
    };

    public getProgramsWithCourseRequirements: RequestHandler = async (req, res, next) => {
        const courseId = req.params.courseId;
        try {
            const course: Course = await this.courseService.getCourse(courseId);
            const programs = await this.courseService.getProgramsWithRequiredCourses(courseId);
            res.status(HTTP_STATUS.OK).send(
                programs.map((p) => CourseDto.programToRequirementsForProgramDto(course, p.id)),
            );
        } catch (e) {
            next(e);
        }
    };

    public getCourseRequirementsForProgram: RequestHandler = async (req, res, next) => {
        const courseId = req.params.courseId;
        const programId = req.params.programId;

        try {
            const course = await this.courseService.getCourse(courseId);
            const university = await course.getUniversity();
            const courses = await this.courseService.getCourseRequirementsForProgram(courseId, programId);
            res.status(HTTP_STATUS.OK).send(courses.map((c) => CourseDto.courseToDto(c, university.id)));
        } catch (e) {
            next(e);
        }
    };

    public getCourseCourseClasses: RequestHandler = async (req, res, next) => {
        const courseId = req.params.courseId;
        const termId = req.query.termId as string | undefined;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) ?? undefined;
        const per_page = parseInt(req.query.per_page as string) ?? undefined;

        try {
            const courseClasses = await this.courseClassService.getCourseClassesByCourse(
                courseId,
                termId,
                filter,
                per_page,
                page,
            );
            const courseClassesWithCourseAndTerm: { courseClass: CourseClass; course: Course; term: Term }[] =
                await Promise.all(
                    courseClasses.collection.map(async (cc) => {
                        return {
                            courseClass: cc,
                            course: await cc.getCourse(),
                            term: await cc.getTerm(),
                        };
                    }),
                );
            const links: Record<string, string> = {};
            for (const [key, value] of Object.entries(courseClasses.pagingInfo)) {
                links[key] = CourseDto.getCourseCourseClassesUrl(courseId, termId, filter, value, per_page);
            }
            res.status(HTTP_STATUS.OK)
                .links(links)
                .send(
                    courseClassesWithCourseAndTerm.map((ccwcat) =>
                        CourseClassDto.courseClassToDto(ccwcat.courseClass, ccwcat.course.id, ccwcat.term.id),
                    ),
            );
        } catch (e) {
            next(e);
        }
    };

    public createCourse: RequestHandler = async (req, res, next) => {
        const userInfo = req.user;
        const name = req.body.name as string;
        const internalId = req.body.internalId as string;
        const requirements = req.body.requirements as { [programId: string]: string[] };

        try {
            const course: Course = await this.courseService.createCourse(userInfo.id, name, internalId, requirements);
            res.status(HTTP_STATUS.CREATED).location(CourseDto.getCourseUrl(course.id)).send();
        } catch (e) {
            next(e);
        }
    };

    public updateCourse: RequestHandler = async (req, res, next) => {
        const courseId = req.params.courseId;
        const userInfo = req.user;

        const name = req.body.name as string;
        const internalId = req.body.internalId as string;
        const requirements = req.body.requirements as { [p: string]: string[] };

        try {
            const course: Course = await this.courseService.updateCourse(courseId, name, internalId, requirements);
            res.status(HTTP_STATUS.OK).location(CourseDto.getCourseUrl(course.id)).send();
        } catch (e) {
            next(e);
        }
    };
}
