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
import Schedule from '../models/abstract/schedule.model';
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

        // STEP 1 - Get mandatory and optional courses in program
        const mandatoryCourses = await program.getMandatoryCourses();
        const optionalCourses = await program.getOptionalCourses();
        const courses = [...mandatoryCourses.collection, ...optionalCourses.collection];

        // STEP 2 - Filter already completed courses and courses the student is not yet enabled to sign up for
        const enabledCourses = await student.getEnabledCourses(program.id);

        // STEP 3 - Calculate "importance" of each course (direct + indirect unlockables)
        const correlatives = await this.getIndirectCorrelatives(programId, enabledCourses);
        const importance: { [courseId: string]: number } = {};
        for(const c of courses) importance[c.id] = correlatives[c.id].size;

        // STEP 4 - Get all courseClasses for each course
        // STEP 5 - Remove courseClasses that fall inside unavailableTimeSlots
        // STEP 6 - Get all possible schedules based on those remaining courseClasses
        // STEP 7 - Remove invalid schedules:
            // STEP 7a - Only one courseClass per Course
            // STEP 7b - No time Overlap
            // STEP 7c - No unavailable time between buildings
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
    };
}
