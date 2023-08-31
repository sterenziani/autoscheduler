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
import Schedule from '../models/abstract/schedule.model';
import Lecture from '../models/abstract/lecture.model';
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
        hours: number,
        reduceDays: boolean,
        prioritizeUnlocks: boolean,
        unavailableTimeSlots: TimeRange[]
    ): Promise<Schedule[]> {
        const student = await this.studentService.getStudent(studentId);
        const program = await this.programService.getProgram(programId);
        const term = await this.termService.getTerm(termId);
        if (!student) throw new GenericException(ERRORS.NOT_FOUND.STUDENT);
        if (!program) throw new GenericException(ERRORS.NOT_FOUND.PROGRAM);
        if (!term) throw new GenericException(ERRORS.NOT_FOUND.TERM);

        // STEP 1 - Get mandatory and optional courses in program
        const mandatoryCourses = await program.getMandatoryCourses();
        const optionalCourses = await program.getOptionalCourses();
        const courses = [...mandatoryCourses.collection, ...optionalCourses.collection];

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
        let courseClassCombinations = await this.getCourseClassCombinations(viableCourseClassesArray);

        // STEP 8 - Calculate stats for every valid schedule
            // diasTotales := Número de días en los cuales hay al menos una clase.
            // horasTotales := Horas totales de clase por semana.
            // importanciaTotal := Suma de valores importancia de cada materia que conforme el cronograma.
            // tasaElectivas := Cantidad de horas semanales correspondientes a materias electivas para el plan, dividido por la cantidad de horas totales en el cronograma.
            // Horario más temprano en el que inicia una clase
            // Horario más tardío en el que termina una clase
        // STEP 9 - Calculate score for each schedule
            // p1 := 1 - tasaElectivas
            // p2 := abs(horasDeseadas - horasTotales)
            // p3 := 7 - diasTotales
            // p4 := importanciaTotal
            // A := 1 si reducirDías es verdadero, 0 si es falso
            // B := 1 si priorizarCorrelativas es verdadero, 0 si es falso
            // score := 10*p1 – p2 + A*3.5*p3 + B*p4
        // STEP 10 - Return sorted list of schedules by score

        return [];
    }

    // This is also implemented in course model, but being able to access the created map is much more efficient than starting from scratch for each course.
    // If coursesToAnalyze is defined, we recursively expand only those courses for efficiency.
    private async getIndirectCorrelatives(programId: string, coursesToAnalyze?: Course[]): Promise<{ [courseId: string]: Set<Course> }> {
        const program = await this.programService.getProgram(programId);
        const mandatoryCourses = await program.getMandatoryCourses();
        const optionalCourses = await program.getOptionalCourses();
        const programCourses = [...mandatoryCourses.collection, ...optionalCourses.collection];

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
    // [ [c1A, c1B], [c2A, c2B], [c3A] ]
    // Returns all valid combinations of classes belonging to different courses.
    private async getCourseClassCombinations(arr: CourseClass[][]): Promise<CourseClass[][]> {
        if(arr.length === 0) return [[]];
        if(arr.length === 1) return [arr[0]];

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
                        if(b1.id != b2.id) {
                            const distance = await b1.getDistanceInMinutesTo(b2.id);
                            if(gap < (distance?distance:0)) return false;
                        }
                    }
                }
            }
        }
        return true;
    }
}
