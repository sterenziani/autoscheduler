import Time from '../helpers/classes/time.class';
import Course from '../models/abstract/course.model';
import Lecture from '../models/abstract/lecture.model';
import CourseClass from '../models/abstract/courseClass.model';

export interface IScheduleInputData {
    courses: Map<string, Course>,                       // Courses that belong to program that student has enabled (aka not completed and fulfilled requirements)
    courseClasses: Map<string, CourseClass>,            // Course classes of the given courses, that happen in the given term
    lectures: Map<string, Lecture>,                     // Lectures of the given course classes

    mandatoryCourseIds: Set<string>,                       // Of the given courses, which are mandatory. Sorted by importance
    optionalCourseIds: Set<string>,                        // Of the given courses, which are optional. Sorted by importance

    indirectCorrelativesAmount: Map<string, number>,    // courseId -> number
    weeklyClassTimeInMinutes: Map<string, number>,      // courseClassId -> number

    courseClassesOfCourse: Map<string, string[]>,       // courseId -> courseClassIds
    courseOfCourseClass: Map<string, string>,           // courseClassId -> courseId
    lecturesOfCourseClass: Map<string, string[]>,       // courseClassId -> lectureIds

    lectureBuilding: Map<string, string>                // lectureId -> buildingId
    distances: Map<string, Map<string, number>>         // buildingId 1 -> buildingId 2 -> distance between 1-2

    remainingOptionalCredits: number                    // Remaining optional course credits needed to graduate
    incompatibilityCache: Map<string, Set<string>>
}

export interface ISchedule {
    courseClasses: CourseClass[];
    totalHours: number;
    totalDays: number;
    totalImportance: number;
    mandatoryRate: number;
    earliestLecture: Time;
    latestLecture: Time;
    optionalCredits: number;
}

export interface IAlgorithmParams {
    maxSchedulesToProcess: number,
    maxMsDeadlineToProcess: number,
    maxAmountToReturn: number,
    useGeneticAlgorithm: boolean,

    greedyPruning: boolean,
    shuffleCourses: boolean,
    fixedIndexesDuringShuffle: number,
    targetHourExceedRateLimit: number,
    minAmountOfSchedulesToPruneByAvg: number,
    minAmountOfProcessedCoursesToPruneByAvg: number,
    minHoursToPruneByAvg: number,

    generationSize: number,
    generations: number,
    bestPickedFromEachGeneration: number
};

export interface IScheduleWithScore {
    schedule: ISchedule,
    score: number,
}

export interface IGeneticIndexCombinationWithScore {
    schedule: ISchedule | undefined,
    combo: number[],
    score: number,
}
