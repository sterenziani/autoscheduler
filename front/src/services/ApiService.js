import { CREATED, CONFLICT, TIMEOUT, NOT_FOUND, OK } from './ApiConstants';
import SgaConstants from '../resources/SgaConstants';
import api from './api'
import AuthService from './AuthService'
const RESOLVE_DELAY = 250;

const parsePagination = (response) => {
    let arrData = response.headers.link
    let links = {}

    if(arrData){
        arrData = arrData.split(",")
        for (var d of arrData){
            let linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/ig.exec(d)
            links[linkInfo[2]] = api.defaults.baseURL + "/" + linkInfo[1]
        }
    }
    return links
}

const paramsToQuery = (params) => {
    let query = '';
    if (params) {
        query += '?program=' + params.program;
        query += '&term=' + params.term;
        query += '&hours=' + params.hours;
        query += '&reduceDays=' + params.reduceDays;
        query += '&prioritizeUnlocks=' + params.prioritizeUnlocks;
        if (params.unavailableTimeSlots) {
            params.unavailableTimeSlots.forEach((slot) => {
                query += '&unavailable=' + slot;
            });
        }
    }
    return query;
};

/*
TO USE ONCE ALGORITHM IS MOVED TO BACK-END
const getSchedules = async (params) => {
    try{
      const query = paramsToQuery(params);
      const response = await fetch('schedules'+query);
      return await response.json();
    }catch(error) {
      console.log("ERROR")
      if(error.response) {
        return { status : error.response.status };
      } else {
        return { status : TIMEOUT }
      }
    }
}
*/

const registerStudent = async (name, email, password, universityId, programId) => {
    return AuthService.signUpStudent(name, email, password, universityId, programId)
};

const registerUniversity = async (email, password, name) => {
    return AuthService.signUpUniversity(email, password, name)
};

const login = async (username, password) => {
    return AuthService.logIn(username, password)
};

const logout = () => {
    AuthService.logOut()
};

const requestPasswordChangeToken = async (username) => {
    try {
        // Hacer algo
        return { status: CREATED };
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
};

const getActiveUser = () => {
    return AuthService.getUserStore()
}

const getStudent = async (studentId) => {
    try{
        let user = getActiveUser()
        if(user.id != studentId){
            const endpoint = "student/"+studentId
            const resp = await api.get(endpoint, AuthService.getRequestHeaders())
            user = resp.data
        }
        const universityResponse = await api.get(user.universityUrl, AuthService.getRequestHeaders())
        const programResponse = await api.get(user.programUrl, AuthService.getRequestHeaders())
        return {
            ...user,
            university: universityResponse.data,
            program: programResponse.data
        }
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getSchedules = (params) =>
    new Promise((resolve, reject) => {
        let availableClasses = getAvailableClasses(params.userAsking, params.program); // Gets the classes the user is enabled to be in
        availableClasses = filterUnattendableClasses(availableClasses, params.unavailableTimeSlots); // Deletes classes that conflict with busy time
        calculateDurationOfEachClass(availableClasses); // Updates classes with time spent in each
        const schedules = getBestSchedules(availableClasses, params.hours, params.prioritizeUnlocks, params.reduceDays); // Returns sorted array
        setTimeout(() => resolve(schedules), RESOLVE_DELAY);
    });

const getUniversities = async (inputText) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage){
            const endpoint = "/universities?filter="+inputText +"&page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            finalResponse.data = finalResponse.data.concat(response.data)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCourse = async (courseId) => {
    try {
        const endpoint = "/course/"+courseId
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getTerm = (termId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const term = SgaConstants.terms.find((t) => t.id == termId);
        setTimeout(() => resolve(term), RESOLVE_DELAY);
    });

const getProgram = async (programId) => {
    try {
        const endpoint = "/program/"+programId
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getBuilding = async (buildingId) => {
    try {
        const endpoint = "/building/"+buildingId
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCourseClass = (classId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const courseClass = Object.values(SgaConstants.courseClasses).flat().filter((com) => com.id == classId);
        if(!courseClass)
            return { status: NOT_FOUND }
        setTimeout(() => resolve(courseClass[0]), RESOLVE_DELAY);
    });

const getRequiredCourses = async (courseId) => {
    try {
        // get Program IDs
        let programIDs = []
        let page = 0
        let lastPage = 0
        while(page <= lastPage){
            const endpoint = "/course/"+courseId+"/requirements?page=" +page
            const programsResponse = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(programsResponse)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            programIDs = programIDs.concat(programsResponse.data.map(p => p.programId))
        }

        // Request courses for each program
        const finalResponse = {data: {}}
        programIDs.forEach(async (pId) => {
            finalResponse.data[pId] = []
            const coursesResponse = await getRequiredCoursesForProgram(courseId, pId)
            finalResponse.data[pId] = finalResponse.data[pId].concat(coursesResponse.data)
            finalResponse.status = coursesResponse.status
        });
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getRequiredCoursesForProgram = async (courseId, programId) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage){
            const endpoint = "/course/"+courseId+"/requirements/"+programId +"?page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            finalResponse.data = finalResponse.data.concat(response.data)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getMandatoryCourses = async (programId) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage){
            const endpoint = "/program/"+programId+"/courses/mandatory" +"?page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            finalResponse.data = finalResponse.data.concat(response.data)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getOptionalCourses = async (programId) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage){
            const endpoint = "/program/"+programId+"/courses/optional" +"?page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            finalResponse.data = finalResponse.data.concat(response.data)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCourseClassesForTerm = (courseId, termId, page) =>
    new Promise((resolve, reject) => {
        const availableClasses = SgaConstants.courseClasses[termId].filter((com) => com.course.id === courseId);
        if(availableClasses.length >= 2 && page==1)
            setTimeout(() => resolve([availableClasses[0], availableClasses[1]]), RESOLVE_DELAY);
        else if(availableClasses.length >= 3 && page==2)
            setTimeout(() => resolve([availableClasses[2]]), RESOLVE_DELAY);
        else
            setTimeout(() => resolve(availableClasses), RESOLVE_DELAY);
    });

const getPrograms = async (universityId, inputText) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage){
            const endpoint = "/university/" + universityId + "/programs?filter=" + inputText +"&page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            finalResponse.data = finalResponse.data.concat(response.data)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getProgramsPage = async (universityId, page) => {
    try {
        const endpoint = "/university/" + universityId + "/programs?page=" + (page-1)
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCourses = async (universityId, inputText) => {
    try {
        const endpoint = "/university/" + universityId + "/courses?filter=" + inputText
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCoursesNotInList = async (universityId, inputText, coursesToFilter) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage && finalResponse.data.length < 20){
            const endpoint = "/university/" + universityId + "/courses?filter=" + inputText +"&page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            const foundCourses = response.data.filter((item) => !coursesToFilter.find((c) => c.id === item.id))
            finalResponse.data = finalResponse.data.concat(foundCourses)
            finalResponse.data.length = Math.min(20, finalResponse.data.length)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCoursesPage = async (universityId, page) => {
    try {
        const endpoint = "/university/" + universityId + "/courses?page=" + (page-1)
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getTerms = async (universityId, page) =>
    new Promise((resolve, reject) => {
        const terms = SgaConstants.terms;
        if(!page)
            setTimeout(() => resolve(terms), RESOLVE_DELAY);
        else{
            if(page==1)
                setTimeout(() => resolve([terms[0], terms[1]]), RESOLVE_DELAY);
            else if(page==2)
                setTimeout(() => resolve([terms[2]]), RESOLVE_DELAY);
            else
                setTimeout(() => resolve([]), RESOLVE_DELAY);
        }
    });

const getBuildings = async (universityId, page) => {
    try {
        const endpoint = "/university/" + universityId + "/buildings?page=" +(page-1)
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getAllBuildings = async (universityId, page) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage){
            const endpoint = "/university/" + universityId + "/buildings?page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }
            finalResponse.data = finalResponse.data.concat(response.data)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getBuildingDictionary = async (universityId, page) => {
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: {}}
        while(page <= lastPage){
            const endpoint = "/university/" + universityId + "/buildings?page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            const links = parsePagination(response)

            page = page+1
            if(links && links.last && links.last.includes("page=")){
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))
            }

            response.data.forEach(b => finalResponse.data[b.id] = b)
            finalResponse.status = response.status
        }
        return finalResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getRemainingCoursesProgram = async (user, programId, inputText) => {
    // TODO: Placeholder. This should be a call to API's getRemainingCoursesProgram, filtering results by program and removing those already finished by user
    const courses = await getCourses(user.university.id, inputText)
    return courses
}

const getFinishedCourses = async (studentId, page) => {
    try {
        const endpoint = "student/" +studentId +"/completed-courses?page=" + (page-1)
        const response = await api.get(endpoint, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const addFinishedCourse = async (studentId, courseId) => {
    try {
        const endpoint = "student/" +studentId +"/completed-courses"
        const body = {courseIds: [courseId]}
        const response = await api.post(endpoint, body, AuthService.getRequestHeaders())
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const deleteFinishedCourse = async (studentId, courseId) => {
    try {
        const endpoint = "student/" +studentId +"/completed-courses"
        const config = AuthService.getRequestHeaders()
        config.data = {courseIds: [courseId]}
        const response = await api.delete(endpoint, config) // config.data needed for DELETE syntax
        return response
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const deleteProgram = (program) =>
    new Promise((resolve, reject) => {
        const programs = SgaConstants.programs[9];
        programs.splice(programs.indexOf(program), 1);
        setTimeout(() => resolve(programs), RESOLVE_DELAY);
    });

const deleteCourse = (course) =>
    new Promise((resolve, reject) => {
        const courses = SgaConstants.courses[9];
        courses.splice(courses.indexOf(course), 1);
        setTimeout(() => resolve(courses), RESOLVE_DELAY);
    });

const deleteBuilding = (building) =>
    new Promise((resolve, reject) => {
        const buildings = SgaConstants.buildings[9];
        buildings.splice(buildings.indexOf(building), 1);
        setTimeout(() => resolve(buildings), RESOLVE_DELAY);
    });

const deleteCourseClass = (courseClass) =>
    new Promise((resolve, reject) => {
        const classes = SgaConstants.courseClasses;
        Object.values(classes).forEach((termClasses) => termClasses.splice(termClasses.indexOf(courseClass), 1));
        setTimeout(() => resolve(classes), RESOLVE_DELAY);
    });

const deleteTerm = (term) =>
    new Promise((resolve, reject) => {
        const terms = SgaConstants.terms;
        terms.splice(terms.indexOf(term), 1);
        setTimeout(() => resolve(terms), RESOLVE_DELAY);
    });

async function publishTerm(term) {
    const terms = SgaConstants.terms;
    const found_term = terms[terms.indexOf(term)];
    if (found_term) found_term.published = true;
    return { status: OK };
}

async function unpublishTerm(term) {
    const terms = SgaConstants.terms;
    const found_term = terms[terms.indexOf(term)];
    if (found_term) found_term.published = false;
    return { status: OK };
}

const saveCourseClass = async (id, course, term, name, lectures) => {
    try {
        if(id)
            return { status: OK };
        else
            return { status: CREATED };
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
}

const saveTerm = async (id, name, internalId, startDate) => {
    try {
        if(id){
            return { status: OK };
        }
        else{
            return { status: CREATED };
        }
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
}

const saveCourse = async (id, name, internalId, requirements) => {
    try {
        const requirementIDs = {}
        Object.keys(requirements).map(key => {
            requirementIDs[key] = requirements[key].map(a => a.id)
        })
        const payload = {
            'name': name,
            'internalId': internalId,
            "requirements": requirementIDs,
        }
        if(id){
            return updateCourse(payload, id)
        }
        else{
            return createCourse(payload)
        }
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
}

const createCourse = async (payload) => {
    try {
        const response = await api.post("/course", payload, AuthService.getRequestHeaders())
        const id = response.headers.location.split('/')[1]
        return { status: CREATED, id: id }
    }
    catch(e) {
        if (e.response){
            return { status: e.response.status, data: e.response.data}
        }
        else
            return { status: TIMEOUT }
    }
}

const updateCourse = async (payload, courseId) => {
    try {
        const response = await api.put("/course/"+courseId, payload, AuthService.getRequestHeaders())
        const id = response.headers.location.split('/')[1]
        return { status: OK, id: id }
    }
    catch(e) {
        if (e.response){
            return { status: e.response.status, data: e.response.data}
        }
        else
            return { status: TIMEOUT }
    }
}

const saveProgram = async (id, name, internalId, mandatoryCourses, optionalCourses) => {
    try {
        let mandatoryCourseIDs = mandatoryCourses.map(a => a.id)
        let optionalCourseIDs = optionalCourses.map(a => a.id)
        const payload = {
            'id': id,
            'name': name,
            'internalId': internalId,
            "mandatoryCourses": mandatoryCourseIDs,
            "optionalCourses": optionalCourseIDs,
        }
        if(id)
            return updateProgram(payload, id)
        else
            return createProgram(payload)
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
}

const createProgram = async (payload) => {
    try {
        const response = await api.post("/program", payload, AuthService.getRequestHeaders())
        const id = response.headers.location.split('/')[1]
        return { status: CREATED, id: id }
    }
    catch(e) {
        if (e.response){
            return { status: e.response.status, data: e.response.data}
        }
        else
            return { status: TIMEOUT }
    }
}

const updateProgram = async (payload, programId) => {
    try {
        const response = await api.put("/program/"+programId, payload, AuthService.getRequestHeaders())
        const id = response.headers.location.split('/')[1]
        return { status: OK, id: id }
    }
    catch(e) {
        if (e.response){
            return { status: e.response.status, data: e.response.data}
        }
        else
            return { status: TIMEOUT }
    }
}

const saveBuilding = async (id, name, internalId, distances) => {
    try {
        const distanceIDs = {}
        for (let [key, pair] of Object.entries(distances)){
            distanceIDs[pair.building.id] = pair.time
        }
        const payload = {
            'name': name,
            'internalId': internalId,
            "distances": distanceIDs,
        }
        if(id)
            return updateBuilding(payload, id)
        else
            return createBuilding(payload)
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
}

const createBuilding = async (payload) => {
    try {
        const response = await api.post("/building", payload, AuthService.getRequestHeaders())
        const id = response.headers.location.split('/')[1]
        return { status: CREATED, id: id }
    }
    catch(e) {
        if (e.response){
            return { status: e.response.status, data: e.response.data}
        }
        else
            return { status: TIMEOUT }
    }
}

const updateBuilding = async (payload, buildingId) => {
    try {
        const response = await api.put("/building/"+buildingId, payload, AuthService.getRequestHeaders())
        const id = response.headers.location.split('/')[1]
        return { status: OK, id: id }
    }
    catch(e) {
        if (e.response){
            return { status: e.response.status, data: e.response.data}
        }
        else
            return { status: TIMEOUT }
    }
}

const getToken = async (token) =>
    new Promise((resolve, reject) => {
        const resp = {status: OK, user: {id: "primero", email:"estudiante1@itba.edu.ar"}};
        setTimeout(() => resolve(resp), RESOLVE_DELAY);
    });

const changePassword = async (userId, token, newPassword) => {
    try {
        const endpoint = "users/"+userId+"/password";
        const response = await api.put(endpoint, {'token': token, 'password': newPassword},
                                                { headers: { 'Content-Type': 'application/json' , authorization: AuthService.getToken()}});
        return response;
    } catch(err) {
      if(err.response)
        return { status : err.response.status }
      else
        return { status : TIMEOUT }
    }
}

const ApiService = {
    registerStudent: registerStudent, // OK
    registerUniversity: registerUniversity, // OK
    login: login, // OK
    logout: logout, // OK
    getActiveUser: getActiveUser, // OK
    getStudent: getStudent, // OK
    getUniversities: getUniversities, // OK
    getPrograms: getPrograms, // OK
    getProgramsPage: getProgramsPage, // OK
    getBuildings: getBuildings, // OK
    getAllBuildings: getAllBuildings, // OK
    getBuildingDictionary: getBuildingDictionary, // OK
    getFinishedCourses: getFinishedCourses, // OK
    getCourse: getCourse, // OK
    getProgram: getProgram, // OK
    getBuilding: getBuilding, // OK
    getRequiredCourses: getRequiredCourses, // OK
    getRequiredCoursesForProgram: getRequiredCoursesForProgram, // OK
    getMandatoryCourses: getMandatoryCourses, // OK
    getOptionalCourses: getOptionalCourses, // OK
    addFinishedCourse: addFinishedCourse, // OK
    deleteFinishedCourse: deleteFinishedCourse, // OK
    getCourses: getCourses, // OK
    getCoursesPage: getCoursesPage, // OK
    getCoursesNotInList: getCoursesNotInList, // OK
    saveCourse: saveCourse, // OK
    saveProgram: saveProgram, // OK
    saveBuilding: saveBuilding, // OK
    deleteCourse: deleteCourse,
    deleteProgram: deleteProgram,
    getRemainingCoursesProgram: getRemainingCoursesProgram,
    deleteBuilding: deleteBuilding,
    getTerm: getTerm,
    deleteTerm: deleteTerm,
    publishTerm: publishTerm,
    unpublishTerm: unpublishTerm,
    saveTerm: saveTerm,
    getTerms: getTerms,
    getCourseClass: getCourseClass,
    getCourseClassesForTerm: getCourseClassesForTerm,
    deleteCourseClass: deleteCourseClass,
    saveCourseClass: saveCourseClass,
    getSchedules: getSchedules,
    requestPasswordChangeToken: requestPasswordChangeToken,
    getToken: getToken,
    changePassword: changePassword,
    parsePagination: parsePagination // OK
};

export default ApiService;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////// ALGORITMO, ESTO SE MOVERÍA AL BACK //////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const getAvailableClasses = (student, programId) => {
    const map = calculateImportanceOfEachCourse(SgaConstants.programCourses[programId], programId);
    const passedCourses = SgaConstants.finishedCourses.find((c) => c.student === student).courses;
    const availableCourses = SgaConstants.programCourses[programId].filter((c) => {
        if (passedCourses.includes(c.id))
            return false;
        if (c.requirements && c.requirements[programId])
            return c.requirements[programId].every((req) => passedCourses.includes(req));
        return true;
    });
    const availableCourseCodes = [];
    availableCourses.forEach((c) => availableCourseCodes.push(c.id));
    const availableClasses = SgaConstants.courseClasses2022A.filter((com) => availableCourseCodes.includes(com.course.id));
    availableClasses.forEach((c) => {
        c.unlockables = map[c.course.id] ? map[c.course.id] : 0; // Adds importance of that course to the class
    });
    return availableClasses;
};

const filterUnattendableClasses = (availableClasses, unavailableTimeSlots) => {
    const busySlots = [];
    unavailableTimeSlots.forEach((t) => {
        t = t.split('-');
        busySlots.push({ day: t[0], startTime: t[1], endTime: t[2] });
    });
    return availableClasses.filter((com) => areTimeSlotsCompatible(com.lectures, busySlots));
};

const areTimeSlotsCompatible = (slotsA, slotsB) => {
    for (const t of slotsA) {
        for (const l of slotsB) {
            if (l.day === t.day) {
                if (t.startTime <= l.startTime && l.startTime < t.endTime) return false;
                if (l.startTime <= t.startTime && t.startTime < l.endTime) return false;
            }
        }
    }
    return true;
};

const calculateImportanceOfEachCourse = (programCourses, programId) => {
    const map = {};
    programCourses.forEach((c) => {
        if (c.requirements && c.requirements[programId])
            c.requirements[programId].forEach((r) => {
                if (!map[r])
                    map[r] = [];
                map[r].push(c);
            });
    });
    const importanceMap = {};
    for (const key in map) importanceMap[key] = importanceRec(map, key);
    programCourses.forEach((c) => {
        c.unlockables = map[c.id] ? map[c.id] : 0;
    });
    return importanceMap;
};

const importanceRec = (map, c) => {
    if (!map[c]) return 0;
    let resp = map[c].length;
    map[c].forEach((u) => {
        resp += importanceRec(map, u);
    });
    return resp;
};

const calculateDurationOfEachClass = (classes) => {
    classes.forEach((c) => {
        c.weeklyHours = 0;
        c.days = new Set();
        c.earliest = '23:59';
        c.latest = '00:00';
        c.lectures.forEach((l) => {
            let startTime = l.startTime.split(/\D+/);
            let endTime = l.endTime.split(/\D+/);
            startTime = startTime[0] * 60 + startTime[1] * 1;
            endTime = endTime[0] * 60 + endTime[1] * 1;
            c.weeklyHours += (endTime - startTime) / 60;
            c.days.add(l.day);
            if (l.startTime < c.earliest) c.earliest = l.startTime;
            if (l.endTime > c.latest) c.latest = l.endTime;
        });
    });
};

const getBestSchedules = (availableClasses, desiredHours, prioritizeUnlocks, reduceDays) => {
    const courseCombinations = getCourseCombinations(availableClasses);
    const schedules = [];
    courseCombinations.forEach((combo, idx) => {
        let lectureHours = 0;
        let days = new Set();
        let unlockables = 0;
        let earliest = '23:59';
        let latest = '00:00';
        combo.forEach((c) => {
            lectureHours += c.weeklyHours;
            unlockables += c.unlockables;
            days = new Set([...days, ...c.days]);
            if (c.earliest < earliest) earliest = c.earliest;
            if (c.latest > latest) latest = c.latest;
        });

        let score = -Math.abs(desiredHours - lectureHours);
        if (reduceDays) score += (7 - days.size) * 3.5;
        if (prioritizeUnlocks) score += unlockables;
        schedules.push({
            courseClasses: combo,
            score: score,
            hours: lectureHours,
            days: days.size,
            earliest: earliest,
            latest: latest,
        });
    });
    return schedules
        .sort((a, b) => {
            return b.score - a.score;
        })
        .slice(0, 10);
};

const getCourseCombinations = (arr = []) => {
    const combine = (sub, ind) => {
        let result = [];
        let i, l, p;
        for (i = ind, l = arr.length; i < l; i++) {
            p = sub.slice(0);
            p.push(arr[i]);
            result = result.concat(combine(p, i + 1));
            if (isValidSchedule(p)) result.push(p);
        }
        return result;
    };
    return combine([], 0);
};

const isValidSchedule = (courseClasses) => {
    for (const [i1, c1] of courseClasses.entries()) {
        for (const [i2, c2] of courseClasses.entries()) {
            // Same course, different class
            if (c1.course.id === c2.course.id && i1 !== i2) return false;
            // Lectures overlap
            if (c1 !== c2 && !areTimeSlotsCompatible(c1.lectures, c2.lectures)) return false;
        }
    }
    return true;
};
