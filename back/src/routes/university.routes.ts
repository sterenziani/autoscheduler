import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { UniversityController } from '../controllers/university.controller';
import cors from 'cors';
import authUsersOnlyMiddleware from '../middlewares/authUsersOnly.middleware';
import universitiesOnlyMiddleware from '../middlewares/universitiesOnly.middleware';
import newUsersOnlyMiddleware from '../middlewares/newUsersOnly.middleware';
import pagingMiddleware from '../middlewares/paging.middleware';

export class UniversityRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: UniversityController = new UniversityController();

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
        
        // /university routes
        this.router.get(
            '/',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversity
        );
        this.router.post(
            '/',
            authUsersOnlyMiddleware,
            newUsersOnlyMiddleware,
            this.controller.createUniversityForExistingUser
        );
        this.router.put(
            '/',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversity
        );

        // /university/programs routes
        this.router.get(
            '/programs',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityPrograms
        );
        this.router.get(
            '/programs/:programId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityProgram
        );
        this.router.post(
            '/programs',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.createUniversityProgram
        );
        this.router.put(
            '/programs/:programId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityProgram
        );
        this.router.delete(
            '/programs/:programId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityProgram
        );

        // /university/programs/:programId/courses routes
        this.router.get(
            '/programs/:programId/courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityProgramCourses
        );
        this.router.post(
            '/programs/:programId/courses',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.addUniversityProgramCourse
        );
        this.router.put(
            '/programs/:programId/courses/:courseId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityProgramCourse
        );
        this.router.delete(
            '/programs/:programId/courses/:courseId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.removeUniversityProgramCourse
        );

        // /university/programs/:programId/courses-collection routes
        this.router.post(
            '/programs/:programId/courses-collection',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.bulkAddUniversityProgramCourses
        );
        this.router.put(
            '/programs/:programId/courses-collection',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.bulkReplaceUniversityProgramCourses
        );

        // /university/programs/:programId/courses/:courseId/required-courses routes
        this.router.get(
            '/programs/:programId/courses/:courseId/required-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityProgramCourseRequiredCourses
        );
        this.router.post(
            '/programs/:programId/courses/:courseId/required-courses',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.addUniversityProgramCourseRequiredCourse
        );
        this.router.delete(
            '/programs/:programId/courses/:courseId/required-courses/:requiredCourseId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.removeUniversityProgramCourseRequiredCourse
        );
        
        // /university/programs/:programId/courses/:courseId/required-courses-collection routes
        this.router.post(
            '/programs/:programId/courses/:courseId/required-courses-collection',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.bulkAddUniversityProgramCourseRequiredCourses
        );
        this.router.put(
            '/programs/:programId/courses/:courseId/required-courses-collection',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.bulkReplaceUniversityProgramCourseRequiredCourses
        );

        // /university/courses routes
        this.router.get(
            '/courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourses
        );
        this.router.get(
            '/courses/:courseId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourse
        );
        this.router.post(
            '/courses',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.createUniversityCourse
        );
        this.router.put(
            '/courses/:courseId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityCourse
        );
        this.router.delete(
            '/courses/:courseId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityCourse
        );

        // /university/courses/:courseId/course-classes routes
        this.router.get(
            '/courses/:courseId/course-classes',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseCourseClasses
        );
        this.router.get(
            '/courses/:courseId/course-classes/:courseClassId',     // Duplicate
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseCourseClass
        );
        this.router.post(
            '/courses/:courseId/course-classes',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.createUniversityCourseCourseClass
        );
        this.router.put(
            '/courses/:courseId/course-classes/:courseClassId',     // Duplicate
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityCourseCourseClass
        );
        this.router.delete(
            '/courses/:courseId/course-classes/:courseClassId',     // Duplicate
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityCourseCourseClass
        );

        // /university/courses/:courseId/required-courses routes
        this.router.get(
            '/courses/:courseId/required-courses',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseRequiredCourses
        );

        // /university/buildings routes
        this.router.get(
            '/buildings',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityBuildings
        );
        this.router.get(
            '/buildings/:buildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityBuilding
        );
        this.router.post(
            '/buildings',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.createUniversityBuilding
        );
        this.router.put(
            '/buildings/:buildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityBuilding
        );
        this.router.delete(
            '/buildings/:buildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityBuilding
        );

        // /university/buildings/:buildingId/lectures routes
        this.router.get(
            '/buildings/:buildingId/lectures',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityBuildingLectures
        );

        // /university/buildings/:buildingId/distances routes
        this.router.get(
            '/buildings/:buildingId/distances',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityBuildingDistances
        );
        this.router.get(
            '/buildings/:buildingId/distances/:distancedBuildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityBuildingDistance
        );
        this.router.post(
            '/buildings/:buildingId/distances',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.addUniversityBuildingDistance
        );
        this.router.put(
            '/buildings/:buildingId/distances/:distancedBuildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityBuildingDistance
        );
        this.router.delete(
            '/buildings/:buildingId/distances/:distancedBuildingId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.removeUniversityBuildingDistance
        );

        // /university/buildings/:buildingId/distances-collection routes
        this.router.post(
            '/buildings/:buildingId/distances-collection',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.bulkAddUniversityBuildingDistances
        );
        this.router.put(
            '/buildings/:buildingId/distances-collection',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.bulkReplaceUniversityBuildingDistances
        );

        // /university/terms routes
        this.router.get(
            '/terms',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityTerms
        );
        this.router.get(
            '/terms/:termId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityTerm
        );
        this.router.post(
            '/terms',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.createUniversityTerm
        );
        this.router.put(
            '/terms/:termId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityTerm
        );
        this.router.delete(
            '/terms/:termId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityTerm
        );

        // /university/terms/:termId/course-classes routes
        this.router.get(
            '/terms/:termId/course-classes',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityTermCourseClasses
        );

        // /university/students routes
        this.router.get(
            '/students',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityStudents
        );
        this.router.get(
            '/students/:studentId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityStudent
        );

        // /university/course-classes routes
        this.router.get(
            '/course-classes',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseClasses
        );
        this.router.get(
            '/course-classes/:courseClassId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseClass
        );
        this.router.put(
            '/course-classes/:courseClassId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityCourseClass
        );
        this.router.delete(
            '/course-classes/:courseClassId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityCourseClass
        );

        // /university/course-classes/:courseClassId/lectures routes
        this.router.get(
            '/course-classes/:courseClassId/lectures',
            pagingMiddleware,
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseClassLectures
        );
        this.router.get(
            '/course-classes/:courseClassId/lectures/:lectureId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityCourseClassLecture
        );
        this.router.post(
            '/course-classes/:courseClassId/lectures',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.createUniversityCourseClassLecture
        );
        this.router.put(
            '/course-classes/:courseClassId/lectures/:lectureId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.modifyUniversityCourseClassLecture
        );
        this.router.delete(
            '/course-classes/:courseClassId/lectures/:lectureId',
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.deleteUniversityCourseClassLecture
        );

        // /university/lectures routes
        this.router.get(
            '/lectures/:lectureId',                                 // Duplicate
            authUsersOnlyMiddleware,
            universitiesOnlyMiddleware,
            this.controller.getUniversityLecture
        );
    }
}
