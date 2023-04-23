import { ERRORS } from "../../constants/error.constants";
import University from "../../models/abstract/university.model";
import GenericDao from "./generic.dao";

export default abstract class UniversityDao extends GenericDao<University> {
    // Constructor
    constructor() {
        super(ERRORS.NOT_FOUND.UNIVERSITY);
    }
    
    // Abstract Methods
    public abstract create(userId: string, name: string, verified: boolean): Promise<University>;
}