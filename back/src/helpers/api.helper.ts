import { API_SCOPE, ROLE } from "../constants/general.constants";
import User from "../models/abstract/user.model";

export const getScope = (user: User): API_SCOPE => {
    switch (user.role) {
        case ROLE.STUDENT: return API_SCOPE.STUDENT;
        case ROLE.UNIVERSITY: return API_SCOPE.UNIVERSITY;
        default: return API_SCOPE.ADMIN;
    }
}