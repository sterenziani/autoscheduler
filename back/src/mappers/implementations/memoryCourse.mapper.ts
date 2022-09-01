import ICourseMapper from '../interfaces/course.mapper';
import { ICourse } from '../../models/course.model';
import { IUser } from '../../models/user.model';

class MemoryCourseMapper implements ICourseMapper {
    private static instance: ICourseMapper;
    private courses: ICourse[];
    private studentCompletedCourses: { [studentId: string]: string[] };

    constructor() {
        this.courses = [];
        this.studentCompletedCourses = {};

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

    // PRIVATE FUNCTIONS

    // populate with dummy data
    private _populate() {
        // TODO: improve
        // courses
        const firstCourse: ICourse = {
            id: 'materia1',
            name: 'algebra',
            code: '00-01',
        };
        const secondCourse: ICourse = {
            id: 'materia2',
            name: 'Formación General 1',
            code: '00-02',
        };
        const thirdCourse: ICourse = {
            id: 'materia3',
            name: 'Programación Imperativa',
            code: '01-03',
        };
        const fourthCourse: ICourse = {
            id: 'materia4',
            name: 'Estructura de Datos y Algoritmos',
            code: '01-04',
        };
        this.courses.push(firstCourse, secondCourse, thirdCourse, fourthCourse);

        // completed courses
        this.studentCompletedCourses['primero'] = [firstCourse.id];
        this.studentCompletedCourses['segundo'] = [];
        this.studentCompletedCourses['tercero'] = [fourthCourse.id];
    }
}

export default MemoryCourseMapper;
