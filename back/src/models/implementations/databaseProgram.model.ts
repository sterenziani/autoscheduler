import { IProgramCourses } from "../../interfaces/program.interfaces";
import Program from "../abstract/program.model";

export default class DatabaseProgram extends Program {
    public getCourses(): Promise<IProgramCourses> {
        throw new Error("Method not implemented.");
    }
}