import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { StudentController } from '../controllers/student.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import newUsersOnlyMiddleware from '../middlewares/newUsersOnly.middleware';
import studentsOnlyMiddleware from '../middlewares/studentsOnly.middleware';
import pagingMiddleware from '../middlewares/paging.middleware';

export class StudentRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: StudentController = new StudentController();

    constructor() {
        this.init();
    }

    public init() {
        this.router.use(
            urlencoded({
                extended: true,
            }),
        );

        this.router.use(cors());

        // /student routes
        this.router.get(
            '/',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudent
        );
        this.router.post(
            '/',
            authUsersOnlyMiddleware,
            newUsersOnlyMiddleware,
            this.controller.createStudentForExistingUser
        );
        this.router.put(
            '/',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.modifyStudent
        );

        // /student/university routes
        this.router.get(
            '/university',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversity
        );

        // /student/university/programs routes
        this.router.get(
            '/university/programs',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityPrograms
        );
        this.router.get(
            '/university/programs/:programId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityProgram
        );

        // /student/university/programs/:programId/remaining-courses routes
        this.router.get(
            '/university/programs/:programId/remaining-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityProgramRemainingCourses
        );

        // /student/university/programs/:programId/courses routes
        this.router.get(
            '/university/programs/:programId/courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityProgramCourses
        );

        // /student/university/programs/:programId/courses/:courseId/required-courses routes
        this.router.get(
            '/university/programs/:programId/courses/:courseId/required-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityProgramCourseRequiredCourses
        );

        // /student/university/courses routes
        this.router.get(
            '/university/courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourses
        );
        this.router.get(
            '/university/courses/:courseId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourse
        );

        // /student/university/courses/:courseId/course-classes routes
        this.router.get(
            '/university/courses/:courseId/course-classes',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseCourseClasses
        );
        this.router.get(
            '/university/courses/:courseId/course-classes/:courseClassId',  // Duplicate
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseCourseClass
        );

        // /student/university/courses/:courseId/required-courses routes
        this.router.get(
            '/university/courses/:courseId/required-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseRequiredCourses
        );

        // /student/university/buildings routes
        this.router.get(
            '/university/buildings',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityBuildings
        );
        this.router.get(
            '/university/buildings/:buildingId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityBuilding
        );

        // /student/university/buildings/:buildingId/lectures routes
        this.router.get(
            '/university/buildings/:buildingId/lectures',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityBuildingLectures
        );

        // /student/university/buildings/:buildingId/distances routes
        this.router.get(
            '/university/buildings/:buildingId/distances',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityBuildingDistances
        );
        this.router.get(
            '/university/buildings/:buildingId/distances/:distancedBuildingId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityBuildingDistance
        );

        // /student/university/terms routes
        this.router.get(
            '/university/terms',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityTerms
        );
        this.router.get(
            '/university/terms/:termId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityTerm
        );

        // /student/university/terms/:termId/course-classes routes
        this.router.get(
            '/university/terms/:termId/course-classes',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityTermCourseClasses
        );

        // /student/university/course-classes routes (Analyze)
        this.router.get(
            '/university/course-classes',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseClasses
        );
        this.router.get(
            '/university/course-classes/:courseClassId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseClass
        );

        // /student/university/course-classes/:courseClassId/lectures routes (Analyze)
        this.router.get(
            '/university/course-classes/:courseClassId/lectures',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseClassLectures
        );
        this.router.get(
            '/university/course-classes/:courseClassId/lectures/:lectureId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityCourseClassLecture
        );

        // /student/university/lectures routes (Analyze)
        this.router.get(
            '/university/lectures/:lectureId',                          // Duplicate
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentUniversityLecture
        );

        // /student/program routes
        this.router.get(
            '/program',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentProgram
        );
        this.router.put(
            '/program',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.modifyStudentProgram
        );

        // /student/program/remaining-courses routes
        this.router.get(
            '/program/remaining-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentProgramRemainingCourses
        );

        // /student/completed-courses routes
        this.router.get(
            '/completed-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentCompletedCourses
        );
        this.router.post(
            '/completed-courses',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.addStudentCompletedCourse
        );
        this.router.delete(
            '/completed-courses/:courseId',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.removeStudentCompletedCourse
        );

        // /student/completed-courses-collection routes
        this.router.post(
            '/completed-courses-collection',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.bulkAddStudentCompletedCourses
        );
        this.router.put(
            '/completed-courses-collection',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.bulkReplaceStudentCompletedCourses
        );

        // /student/schedules routes
        this.router.get(
            '/schedules',
            authUsersOnlyMiddleware,
            studentsOnlyMiddleware,
            this.controller.getStudentSchedules
        );
    }
}
