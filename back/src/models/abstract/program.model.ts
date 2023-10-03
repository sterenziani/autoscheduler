import { IProgramCourses } from '../../interfaces/program.interfaces';
import GenericModel from './generic.model';

export default abstract class Program extends GenericModel {
    // Properties
    internalId: string; // Internal id of the program as given by the university on creation
    name: string; // Name of the program
    optionalCourseCredits: number; // Amount of credits earned from optional courses that a student needs to graduate under this program.

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string, optionalCourseCredits: number) {
        super(id);
        this.internalId = internalId;
        this.name = name;
        this.optionalCourseCredits = optionalCourseCredits;
    }

    // Methods
    public abstract getCourses(): Promise<IProgramCourses | undefined>;
}
