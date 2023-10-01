import Time from '../helpers/classes/time.class';
import Course from '../models/abstract/course.model';
import Lecture from '../models/abstract/lecture.model';
import CourseClass from '../models/abstract/courseClass.model';

export interface IScheduleInputData {
    mandatoryCourseIds: string[],                       // List of mandatory courseIds returned by program.getCourses()
    optionalCourseIds: string[],                        // List of optional courseIds returned by program.getCourses()
    enabledCourseIds: string[],                         // List of courseIds returned by student.getEnabledCourses()

    courses: Map<string, Course>,                       // courseId -> course data
    indirectCorrelativesAmount: Map<string, number>,    // courseId -> course.getAmountOfIndirectCorrelatives()
    //courseClassesOfCourse: Map<string, string[]>,       // courseId -> courseClassIds returned by course.getCourseClasses() (only needed if next field can not be obtained by query)
    viableCourseClasses: Map<string, string[]>          // courseId -> courseClassIds returned by course.getCourseClasses() that don't overlap unavailableTimeSlots

    courseClasses: Map<string, CourseClass>             // courseClassId -> courseClass data
    courseOfCourseClass: Map<string, string>,           // courseClassId -> courseClass.getCourse() Id
    weeklyClassTimeInMinutes: Map<string, number>,      // courseClassId -> courseClass.getWeeklyClassTimeInMinutes()
    lectures: Map<string, Lecture[]>,                   // courseClassId -> courseClass.getLectures()

    lectureBuildings: Map<string, string>               // lectureId -> lecture.getBuilding() Id
    distances: Map<string, Map<string, number>>         // buildingId 1 -> buildingId 2 -> distance between 1-2
}

export interface ISchedule {
    courseClasses: CourseClass[];
    totalHours: number;
    totalDays: number;
    totalImportance: number;
    mandatoryRate: number;
    earliestLecture: Time;
    latestLecture: Time;
}

export interface IScheduleWithScore {
    schedule: ISchedule,
    score: number
}
