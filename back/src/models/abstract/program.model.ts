import { IProgramCourses } from '../../interfaces/program.interfaces';
import GenericModel from './generic.model';

export default abstract class Program extends GenericModel {
    // Properties
    internalId: string; // Internal id of the program as given by the university on creation
    name: string; // Name of the program

    // Abstract class constructor
    constructor(id: string, internalId: string, name: string) {
        super(id);
        this.internalId = internalId;
        this.name = name;
    }

    // Methods
    public abstract getCourses(): Promise<IProgramCourses | undefined>;
}
