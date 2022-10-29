import ICourseMapper from '../interfaces/course.mapper';
import { ICourse } from '../../models/course.model';

class MemoryCourseMapper implements ICourseMapper {
    private static instance: ICourseMapper;
    // mock stuff
    private courses: ICourse[];
    private studentCompletedCourses: { [studentId: string]: string[] };
    private courseRequiredCourses: { [courseId: string]: { [programId: string]: string[] } };

    constructor() {
        this.courses = [];
        this.studentCompletedCourses = {};
        this.courseRequiredCourses = {};

        // populate students
        this._populate();
    }

    static getInstance = (): ICourseMapper => {
        if (!MemoryCourseMapper.instance) {
            MemoryCourseMapper.instance = new MemoryCourseMapper();
        }
        return MemoryCourseMapper.instance;
    };

    async getStudentCompletedCourses(studentId: string): Promise<ICourse[]> {
        const coursesIds = this.studentCompletedCourses[studentId] ?? [];
        return coursesIds.map((cId) => {
            return this.courses.find((c) => c.id === cId)!;
        });
    }

    async getRequiredCourses(courseId: string, programId: string): Promise<ICourse[]> {
        const coursesIds = (this.courseRequiredCourses[courseId] ?? {})[programId] ?? [];
        return coursesIds.map((cId) => {
            return this.courses.find((c) => c.id === cId)!;
        });
    }

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        // courses
        const firstCourse: ICourse = {
            id: 'materia1',
            name: 'algebra',
            code: '00-01',
            universityId: 'universidadItba',
        };
        const secondCourse: ICourse = {
            id: 'materia2',
            name: 'Formación General 1',
            code: '00-02',
            universityId: 'universidadItba',
        };
        const thirdCourse: ICourse = {
            id: 'materia3',
            name: 'Programación Imperativa',
            code: '01-03',
            universityId: 'universidadItba',
        };
        const fourthCourse: ICourse = {
            id: 'materia4',
            name: 'Estructura de Datos y Algoritmos',
            code: '01-04',
            universityId: 'universidadItba',
        };
        const fifthCourse: ICourse = {
            id: 'materia5',
            name: 'Algoritmos y Estructura de Datos',
            code: '01-04',
            universityId: 'universidadUba',
        };
        this.courses.push(firstCourse, secondCourse, thirdCourse, fourthCourse, fifthCourse);

        // completed courses
        this.studentCompletedCourses['primero'] = [firstCourse.id];
        this.studentCompletedCourses['segundo'] = [];
        this.studentCompletedCourses['tercero'] = [fourthCourse.id];

        // required courses
        this.courseRequiredCourses[thirdCourse.code] = {
            itbaInformatica: ['00-01'],
            itbaLicenciaturaSistemas: ['00-01'],
        };
        this.courseRequiredCourses[fourthCourse.code] = {
            itbaInformatica: ['00-03'],
        };
    }
}

export default MemoryCourseMapper;
