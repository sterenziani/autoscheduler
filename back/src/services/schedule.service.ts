import Program from '../models/abstract/program.model';
import CourseService from './course.service';
import StudentService from './student.service';
import ProgramService from './program.service';
import TermService from './term.service';
import UniversityService from './university.service';
import GenericException from '../exceptions/generic.exception';
import { ERRORS } from '../constants/error.constants';
import { PaginatedCollection } from '../interfaces/paging.interface';
import Course from '../models/abstract/course.model';
import CourseClass from '../models/abstract/courseClass.model';
import {ISchedule} from '../interfaces/schedule.interface';
import Lecture from '../models/abstract/lecture.model';
import Time from '../helpers/classes/time.class';
import TimeRange from '../helpers/classes/timeRange.class';

export default class ScheduleService {
    private static instance: ScheduleService;
    private courseService!: CourseService;
    private studentService!: StudentService;
    private programService!: ProgramService;
    private termService!: TermService;
    private universityService!: UniversityService;

    static getInstance(): ScheduleService {
        if (!ScheduleService.instance) {
            ScheduleService.instance = new ScheduleService();
        }
        return ScheduleService.instance;
    }

    init() {
        this.courseService = CourseService.getInstance();
        this.studentService = StudentService.getInstance();
        this.termService = TermService.getInstance();
        this.programService = ProgramService.getInstance();
        this.universityService = UniversityService.getInstance();
    }

    async getSchedules(
        studentId: string,
        programId: string,
        termId: string,
        targetHours: number,
        reduceDays: boolean,
        prioritizeUnlocks: boolean,
        unavailableTimeSlots: TimeRange[]
    ): Promise<{schedule:ISchedule, score:number}[]> {
        const student = await this.studentService.getStudent(studentId);
        const program = await this.programService.getProgram(programId);
        const term = await this.termService.getTerm(termId);
        if (!student) throw new GenericException(ERRORS.NOT_FOUND.STUDENT);
        if (!program) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);
        if (!term) throw new GenericException(ERRORS.NOT_FOUND.TERM);
        unavailableTimeSlots = unavailableTimeSlots.filter(t => t.startTime < t.endTime);

        // STEP 1 - Get mandatory and optional courses in program
        const mandatoryCourses = await program.getMandatoryCourses();
        const optionalCourses = await program.getOptionalCourses();
        const courses = [...mandatoryCourses, ...optionalCourses];

        // STEP 2 - Filter already completed courses and courses the student is not yet enabled to sign up for
        const enabledCourses = await student.getEnabledCourses(program.id);

        // STEP 3 - Calculate "importance" of each course (direct + indirect unlockables)
        const correlatives = await this.getIndirectCorrelatives(programId, enabledCourses);
        const importance: { [courseId: string]: number } = {};
        for(const c of enabledCourses) importance[c.id] = correlatives[c.id].size;

        // STEP 4 - Get all courseClasses for each course
        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots
        const viableCourseClassesMap = await this.getViableCourseClassesMap(enabledCourses, term.id, unavailableTimeSlots);

        // STEP 6 - Based on those remaining courseClasses, get all possible combinations
        // STEP 7 - Remove invalid schedules (done while combining courseClasses)
        const viableCourseClassesArray = Array.from(viableCourseClassesMap.values());
        const courseClassCombinations = await this.getCourseClassCombinations(viableCourseClassesArray);

        // STEP 8 - Calculate stats for every valid schedule
        // STEP 9 - Calculate score for each schedule
        const schedules = [];
        for(const combo of courseClassCombinations){
            const schedule = await this.createSchedule(combo, program, importance);
            const score = this.calculateScheduleScore(schedule, targetHours, reduceDays, prioritizeUnlocks);
            schedules.push({schedule: schedule, score: score});
        }

        // STEP 10 - Return sorted list of schedules by score
        return schedules.sort((a, b) =>  b.score-a.score).slice(0, 10);
    }

    // This is also implemented in course model, but being able to access the created map is much more efficient than starting from scratch for each course.
    // If coursesToAnalyze is defined, we recursively expand only those courses for efficiency.
    private async getIndirectCorrelatives(programId: string, coursesToAnalyze?: Course[]): Promise<{ [courseId: string]: Set<Course> }> {
        const program = await this.programService.getProgram(programId);
        const mandatoryCourses = await program.getMandatoryCourses();
        const optionalCourses = await program.getOptionalCourses();
        const programCourses = [...mandatoryCourses, ...optionalCourses];

        // Create map where key is a course ID and values are the courses enabled immediately after completing the key.
        const unlocks: { [courseId: string]: Set<Course> } = {};
        for(const c of programCourses) unlocks[c.id] = new Set();
        for(const c of programCourses) {
            const requirements = await c.getRequiredCoursesForProgram(programId);
            requirements.forEach( r => unlocks[r.id].add(c) );
        };

        // Expand each map entry to also include the courses indirectly correlative to it.
        if(coursesToAnalyze){
            for (const c of coursesToAnalyze)
                unlocks[c.id] = this.findIndirectCorrelativesRec(unlocks, c.id);
            // Clear courses we don't wish to analyze to avoid confusion
            for (const key in unlocks)
                if(!coursesToAnalyze.find(x => x.id === key)) unlocks[key] = new Set();
        } else {
            for (const key in unlocks)
                unlocks[key] = this.findIndirectCorrelativesRec(unlocks, key);
        }
        return unlocks;
    }

    private findIndirectCorrelativesRec(unlocks: { [courseId: string]: Set<Course> }, courseId: string): Set<Course> {
        if (!unlocks[courseId]) return new Set();
        unlocks[courseId].forEach( u => {
            const unlockablesFromU = this.findIndirectCorrelativesRec(unlocks, u.id);
            unlocks[courseId] = new Set([...unlocks[courseId], ...unlockablesFromU]);
        });
        return unlocks[courseId];
    }

    private areTimeRangesCompatible(timeRangeA: TimeRange[], timeRangeB: TimeRange[]): boolean {
        for (const tA of timeRangeA) {
            for (const tB of timeRangeB) {
                if(tA.overlaps(tB)) return false;
            }
        }
        return true;
    }

    private async getViableCourseClassesMap(courses: Course[], termId: string, unavailableTimeSlots: TimeRange[]): Promise<Map<string, CourseClass[]>> {
        const viableCourseClassesMap: Map<string, CourseClass[]> = new Map<string, CourseClass[]>();
        for(const c of courses) {
            viableCourseClassesMap.set(c.id, []);
            for(const cc of await c.getCourseClasses(termId)) {
                const ccLectures: Lecture[] = await cc.getLectures();
                if(this.areTimeRangesCompatible(ccLectures.map(l => l.time), unavailableTimeSlots))
                    viableCourseClassesMap.get(c.id)?.push(cc);
            }
        }
        return viableCourseClassesMap;
    }

    // Receives matrix where each array contains classes belonging to a course, example:
    // arr = [ [c1A, c1B], [c2A, c2B], [c3A] ]
    // Returns all valid combinations of classes belonging to different courses.
    private async getCourseClassCombinations(arr: CourseClass[][]): Promise<CourseClass[][]> {
        if(arr.length === 0) return [[]];

        // We will focus on the first array. This will be our "current course" to work on.
        // allCasesOfRest calls this function recursively on all arrays that come after the current course.
        let allCasesOfRest = await this.getCourseClassCombinations(arr.slice(1));
        let result: CourseClass[][] = [];

        // Consider the case where this course is the only one in the schedule
        for(const cc of arr[0])
            result.push([cc]);

        for (let c in allCasesOfRest) {
            // Consider the case where our current course is not used (not every course must be included in a schedule)
            result.push([...allCasesOfRest[c]]);

            // Now consider all combinations between c and each courseClass of our current course
            for (let i = 0; i < arr[0].length; i++) {
                const combinationProposal = [arr[0][i], ...allCasesOfRest[c]];
                // To avoid expanding upon an invalid combination, we only add a combination to the array if it's valid
                if(await this.isClassCombinationValid(combinationProposal))
                    result.push(combinationProposal);
            }
        }
        return result;
    }

    private async isClassCombinationValid(courseClasses: CourseClass[]): Promise<boolean> {
        for(let i=0; i < courseClasses.length-1; i++){
            for(let j=i+1; j < courseClasses.length; j++){
                const lectures1 = await courseClasses[i].getLectures();
                const lectures2 = await courseClasses[j].getLectures();
                for(const l1 of lectures1) {
                    for(const l2 of lectures2) {
                        // STEP 7a - Only one courseClass per Course (Guaranteed in steps 5-6)
                        // STEP 7b - Lectures should not overlap
                        const gap = l1.time.getGapInMinutesAgainst(l2.time);
                        if(gap < 0) return false;

                        // STEP 7c - No unavailable time between buildings
                        const b1 = await l1.getBuilding();
                        const b2 = await l2.getBuilding();
                        if(b1 && b2 && b1.id != b2.id) {
                            const distance = await b1.getDistanceInMinutesTo(b2.id);
                            if(gap < (distance?distance:0)) return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    private async createSchedule(courseClasses: CourseClass[], program: Program, importanceMap: { [courseId: string]: number }): Promise<ISchedule> {
        const mandatoryCoursesInProgram = await program.getMandatoryCourses();

        let totalMinutes = 0;
        let totalDays = new Set();
        let totalImportance = 0;
        let amountOfMandatoryCourses = 0;
        let earliestLecture = Time.maxValue();
        let latestLecture = Time.minValue();

        for(const cc of courseClasses) {
            const course = await cc.getCourse();
            const lectures = await cc.getLectures();

            totalImportance += importanceMap[course.id];
            if(mandatoryCoursesInProgram.includes(course))
                amountOfMandatoryCourses++;

            for(const l of lectures){
                totalMinutes += l.time.getDurationInMinutes();
                totalDays.add(l.time.dayOfWeek);
                if (!earliestLecture || l.time.startTime < earliestLecture) earliestLecture = l.time.startTime;;
                if (!latestLecture || l.time.endTime > latestLecture) latestLecture = l.time.endTime;
            }
        }

        return {
            courseClasses: courseClasses,
            totalHours: totalMinutes/60,
            totalDays: totalDays.size,
            totalImportance: totalImportance,
            mandatoryRate: amountOfMandatoryCourses / courseClasses.length,
            earliestLecture: earliestLecture,
            latestLecture: latestLecture,
        }
    }

    private calculateScheduleScore(schedule: ISchedule, targetHours: number, reduceDays: boolean, prioritizeUnlocks: boolean): number {
        const p1 = schedule.mandatoryRate;
        const p2 = Math.abs(targetHours - schedule.totalHours);
        const p3 = 7 - schedule.totalDays;
        const p4 = schedule.totalImportance;
        const a = (reduceDays)? 1:0;
        const b = (prioritizeUnlocks)? 1:0;
        return 10*p1 - 1.25*p2 + a*3.5*p3 + b*p4
    }
}
