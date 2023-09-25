import Building from "../abstract/building.model";
import Lecture from "../abstract/lecture.model";

export default class DatabaseLecture extends Lecture {
    public getBuilding(): Promise<Building | undefined> {
        throw new Error("Method not implemented.");
    }

}