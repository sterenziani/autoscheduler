import { CREATED, CONFLICT, TIMEOUT, NOT_FOUND, OK } from './ApiConstants';
import SgaConstants from '../resources/SgaConstants';
import api from './api'
import AuthService from './AuthService'
const RESOLVE_DELAY = 250;

//////////////////////////
//// HELPER FUNCTIONS ////
//////////////////////////

const simpleApiGetRequest = async (endpoint) => {
    try {
        return await api.get(endpoint, AuthService.getRequestHeaders())
    }
    catch(e) {
        if (e.response) return { status: e.response.status }
        else return { status: TIMEOUT }
    }
}

const simpleApiPostRequest = async (endpoint, body) => {
    try {
        return await api.post(endpoint, body, AuthService.getRequestHeaders())
    }
    catch(e) {
        if (e.response) return { status: e.response.status }
        else return { status: TIMEOUT }
    }
}

const simpleApiPutRequest = async (endpoint, body) => {
    try {
        return await api.put(endpoint, body, AuthService.getRequestHeaders())
    }
    catch(e) {
        if (e.response) return { status: e.response.status }
        else return { status: TIMEOUT }
    }
}

const simpleApiDeleteRequest = async (endpoint, body) => {
    try {
        const config = AuthService.getRequestHeaders()
        if(body)
            config.data = body // config.data needed for DELETE syntax
        return await api.delete(endpoint, config)
    }
    catch(e) {
        if (e.response) return { status: e.response.status }
        else return { status: TIMEOUT }
    }
}

const createOrUpdateObject = async (baseEndpoint, body, id) => {
    let endpoint = baseEndpoint
    let successStatus = CREATED
    let response
    try {
        if(id){
            endpoint = baseEndpoint + id
            successStatus = OK
            response = await api.put(endpoint, body, AuthService.getRequestHeaders())
        } else {
            response = await api.post(endpoint, body, AuthService.getRequestHeaders())
        }
        const responseId = response.headers.location.split('/')[1]
        return { status: successStatus, id: responseId }
    }
    catch(e) {
        if (e.response) return e.response
        else return { status: TIMEOUT }
    }
}

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

const scheduleParamsToQuery = (params) => {
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
      const query = scheduleParamsToQuery(params);
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

//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// USER FUNCTIONS ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const registerStudent = async (name, email, password, universityId, programId) => {
    return AuthService.signUpStudent(name, email, password, universityId, programId)
}

const registerUniversity = async (email, password, name) => {
    return AuthService.signUpUniversity(email, password, name)
}

const login = async (username, password) => {
    return AuthService.logIn(username, password)
}

const logout = () => {
    AuthService.logOut()
}

const getActiveUser = () => {
    return AuthService.getUserStore()
}

// TODO: Implement me
const requestPasswordChangeToken = async (username) => {
    try {
        // Hacer algo
        return { status: CREATED };
    } catch (e) {
        if (e.response) return { status: e.response.status };
        else return { status: TIMEOUT };
    }
}

// TODO: Implement me
const changePassword = async (userId, token, newPassword) => {
    const endpoint = "users/"+userId+"/password";
    const payload = {'token': token, 'password': newPassword}
    return simpleApiPutRequest(endpoint, payload)
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// STUDENT FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

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

const getFinishedCourses = async (studentId, page) => {
    const endpoint = "student/" +studentId +"/completed-courses?page=" + (page-1)
    return simpleApiGetRequest(endpoint)
}

const addFinishedCourse = async (studentId, courseId) => {
    const endpoint = "student/" +studentId +"/completed-courses"
    const body = {courseIds: [courseId]}
    return simpleApiPostRequest(endpoint, body)
}

const deleteFinishedCourse = async (studentId, courseId) => {
    const endpoint = "student/" +studentId +"/completed-courses"
    const body = {courseIds: [courseId]}
    return simpleApiDeleteRequest(endpoint, body)
}

// TODO: Placeholder. This should be a call to API's getRemainingCoursesProgram, filtering results by program and removing those already finished by user
// Should return a list of courses belonging to a program that haven't yet been passed by the user
const getRemainingCoursesProgram = async (user, programId, inputText) => {
    // TODO: Fix
    return await getCourses(user.university.id, inputText)
}

// TODO: Implement me
const getSchedules = (params) =>
    new Promise((resolve, reject) => {
        let availableClasses = getAvailableClasses(params.userAsking, params.program); // Gets the classes the user is enabled to be in
        availableClasses = filterUnattendableClasses(availableClasses, params.unavailableTimeSlots); // Deletes classes that conflict with busy time
        calculateDurationOfEachClass(availableClasses); // Updates classes with time spent in each
        const schedules = getBestSchedules(availableClasses, params.hours, params.prioritizeUnlocks, params.reduceDays); // Returns sorted array
        setTimeout(() => resolve(schedules), RESOLVE_DELAY);
    }
);

//////////////////////////////////////////////////////////////////////////////
//////////////////////////// UNIVERSITY FUNCTIONS ////////////////////////////
//////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// BUILDING FUNCTIONS /////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getBuildings = async (universityId, page) => {
    const endpoint = "university/" + universityId + "/buildings?page=" +(page-1)
    return simpleApiGetRequest(endpoint)
}

const getAllBuildings = async (universityId) => {
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

const getBuilding = async (buildingId) => {
    return simpleApiGetRequest("building/"+buildingId)
}

const saveBuilding = async (id, name, internalId, distances) => {
    const distanceIDs = {}
    for (let [key, pair] of Object.entries(distances)){
        distanceIDs[pair.building.id] = pair.time
    }
    const payload = {
        'name': name,
        'internalId': internalId,
        "distances": distanceIDs,
    }
    return createOrUpdateObject("building/", payload, id)
}

const deleteBuilding = async (building) => {
    const endpoint = "building/"+building.id
    return simpleApiDeleteRequest(endpoint)
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// PROGRAM FUNCTIONS /////////////////////////////
//////////////////////////////////////////////////////////////////////////////

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

const getProgram = async (programId) => {
    return simpleApiGetRequest("program/"+programId)
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

const saveProgram = async (id, name, internalId, mandatoryCourses, optionalCourses) => {
    let mandatoryCourseIDs = mandatoryCourses.map(a => a.id)
    let optionalCourseIDs = optionalCourses.map(a => a.id)
    const payload = {
        'id': id,
        'name': name,
        'internalId': internalId,
        "mandatoryCourses": mandatoryCourseIDs,
        "optionalCourses": optionalCourseIDs,
    }
    return createOrUpdateObject("program/", payload, id)
}

// TODO: Implement me
const deleteProgram = (program) =>
    new Promise((resolve, reject) => {
        const programs = SgaConstants.programs[9];
        programs.splice(programs.indexOf(program), 1);
        setTimeout(() => resolve(programs), RESOLVE_DELAY);
    });

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// COURSE FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getCourses = async (universityId, inputText) => {
    const endpoint = "university/" + universityId + "/courses?filter=" + inputText
    return simpleApiGetRequest(endpoint)
}

const getCoursesNotInList = async (universityId, inputText, coursesToFilter, limit) => {
    let listSize = limit? limit:20
    try {
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage && finalResponse.data.length < listSize){
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
    const endpoint = "university/" + universityId + "/courses?page=" + (page-1)
    return simpleApiGetRequest(endpoint)
}

const getCourse = async (courseId) => {
    return simpleApiGetRequest("course/"+courseId)
}

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

const saveCourse = async (id, name, internalId, requirements) => {
    const requirementIDs = {}
    Object.keys(requirements).map(key => {
        requirementIDs[key] = requirements[key].map(a => a.id)
    })
    const payload = {
        'name': name,
        'internalId': internalId,
        "requirements": requirementIDs,
    }
    return createOrUpdateObject("course/", payload, id)
}

// TODO: Implement me
const deleteCourse = (course) =>
    new Promise((resolve, reject) => {
        const courses = SgaConstants.courses[9];
        courses.splice(courses.indexOf(course), 1);
        setTimeout(() => resolve(courses), RESOLVE_DELAY);
    });

//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// TERM FUNCTIONS ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// TODO: Implement me
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

// TODO: Implement me
const getTerm = (termId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const term = SgaConstants.terms.find((t) => t.id == termId);
        setTimeout(() => resolve(term), RESOLVE_DELAY);
    });

// TODO: Implement me
async function publishTerm(term) {
    const terms = SgaConstants.terms;
    const found_term = terms[terms.indexOf(term)];
    if (found_term) found_term.published = true;
    return { status: OK };
}

// TODO: Implement me
async function unpublishTerm(term) {
    const terms = SgaConstants.terms;
    const found_term = terms[terms.indexOf(term)];
    if (found_term) found_term.published = false;
    return { status: OK };
}

// TODO: Implement me
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

// TODO: Implement me
const deleteTerm = (term) =>
    new Promise((resolve, reject) => {
        const terms = SgaConstants.terms;
        terms.splice(terms.indexOf(term), 1);
        setTimeout(() => resolve(terms), RESOLVE_DELAY);
    });


//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// CLASS FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// TODO: Implement me
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

// TODO: Implement me
const getCourseClass = (classId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const courseClass = Object.values(SgaConstants.courseClasses).flat().filter((com) => com.id == classId);
        if(!courseClass)
            return { status: NOT_FOUND }
        setTimeout(() => resolve(courseClass[0]), RESOLVE_DELAY);
    });

// TODO: Implement me
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

// TODO: Implement me
const deleteCourseClass = (courseClass) =>
    new Promise((resolve, reject) => {
        const classes = SgaConstants.courseClasses;
        Object.values(classes).forEach((termClasses) => termClasses.splice(termClasses.indexOf(courseClass), 1));
        setTimeout(() => resolve(classes), RESOLVE_DELAY);
    });


//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// EXPORT  //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const ApiService = {
    parsePagination: parsePagination,

    registerStudent:registerStudent,
    registerUniversity:registerUniversity,
    login: login,
    logout: logout,
    getActiveUser: getActiveUser,
    requestPasswordChangeToken: requestPasswordChangeToken, // TODO
    changePassword: changePassword, // TODO
    requestPasswordChangeToken:requestPasswordChangeToken, // TODO
    changePassword:changePassword, // TODO

    getStudent: getStudent,
    getFinishedCourses: getFinishedCourses,
    addFinishedCourse: addFinishedCourse,
    deleteFinishedCourse: deleteFinishedCourse,
    getRemainingCoursesProgram: getRemainingCoursesProgram, // TODO
    getSchedules: getSchedules, // TODO
    getUniversities: getUniversities,

    getBuildings: getBuildings,
    getAllBuildings: getAllBuildings,
    getBuildingDictionary: getBuildingDictionary,
    getBuilding: getBuilding,
    saveBuilding: saveBuilding,
    deleteBuilding: deleteBuilding,

    getPrograms: getPrograms,
    getProgramsPage: getProgramsPage,
    getProgram: getProgram,
    getMandatoryCourses: getMandatoryCourses,
    getOptionalCourses: getOptionalCourses,
    saveProgram: saveProgram,
    deleteProgram: deleteProgram, // TODO

    getCourses: getCourses,
    getCoursesNotInList: getCoursesNotInList,
    getCoursesPage: getCoursesPage,
    getCourse: getCourse,
    getRequiredCourses: getRequiredCourses,
    getRequiredCoursesForProgram: getRequiredCoursesForProgram,
    saveCourse: saveCourse,
    deleteCourse: deleteCourse, // TODO

    getTerms: getTerms, // TODO
    getTerm: getTerm, // TODO
    publishTerm: publishTerm, // TODO
    unpublishTerm: unpublishTerm, // TODO
    saveTerm: saveTerm, // TODO
    deleteTerm: deleteTerm, // TODO

    getCourseClassesForTerm: getCourseClassesForTerm, // TODO
    getCourseClass: getCourseClass, // TODO
    saveCourseClass: saveCourseClass, // TODO
    deleteCourseClass: deleteCourseClass, // TODO
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
