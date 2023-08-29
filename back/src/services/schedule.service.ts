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

        // TODO: Implement

        // STEP 1 - Get mandatory and optional courses in program
        // STEP 2 - Filter already finished courses and courses the student is not yet enabled to sign up for
        // STEP 3 - Calculate "importance" of each course (direct + indirect unlockables)
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
}
