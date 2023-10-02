import Time from '../helpers/classes/time.class';
import Course from '../models/abstract/course.model';
import Lecture from '../models/abstract/lecture.model';
import CourseClass from '../models/abstract/courseClass.model';

export interface IScheduleInputData {
    courses: Map<string, Course>,                       // Courses that belong to program that student has enabled (aka not completed and fulfilled requirements)
    courseClasses: Map<string, CourseClass>,            // Course classes of the given courses, that happen in the given term
    lectures: Map<string, Lecture>,                     // Lectures of the given course classes

    mandatoryCourseIds: string[],                       // Of the given courses, which are mandatory
    optionalCourseIds: string[],                        // Of the given courses, which are optional

    indirectCorrelativesAmount: Map<string, number>,    // courseId -> number
    weeklyClassTimeInMinutes: Map<string, number>,      // courseClassId -> number   // TODO: this should be course.credits
    // viableCourseClasses: Map<string, string[]>          // courseId -> courseClassIds returned by course.getCourseClasses() that don't overlap unavailableTimeSlots

    courseClassesOfCourse: Map<string, string[]>,       // courseId -> courseClassIds
    courseOfCourseClass: Map<string, string>,           // courseClassId -> courseId
    lecturesOfCourseClass: Map<string, string[]>,       // courseClassId -> lectureIds

    lectureBuilding: Map<string, string>                // lectureId -> buildingId
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
