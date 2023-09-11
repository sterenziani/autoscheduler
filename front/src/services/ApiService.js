import { CREATED, CONFLICT, TIMEOUT, NOT_FOUND, OK } from './ApiConstants';
import { DAYS } from './SystemConstants';
import SgaConstants from '../resources/SgaConstants';
import api from './api'
import AuthService from './AuthService'
const RESOLVE_DELAY = 250;
const MULTI_PAGE_SEARCH_LIMIT = 20;

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

const simpleApiMultiPageGetRequest = async (baseEndpoint, inputText, limit, idsToFilter) => {
    try {
        if(!inputText)
            inputText = ""
        let page = 0
        let lastPage = 0
        let finalResponse = {data: []}
        while(page <= lastPage && (!limit || finalResponse.data.length < limit)) {
            const endpoint = baseEndpoint + "?filter="+inputText +"&page=" +page
            const response = await api.get(endpoint, AuthService.getRequestHeaders())

            // Process page data (last is checked every time in case one has been added after first page was read)
            const links = parsePagination(response)
            page = page+1
            if(links && links.last && links.last.includes("page="))
                lastPage = parseInt(links.last.split("page=")[1].match(/\d+/))

            // Add the items we're interested in to finalResponse array
            if(idsToFilter){
                const foundItems = response.data.filter((item) => !idsToFilter.find((c) => c.id === item.id))
                finalResponse.data = finalResponse.data.concat(foundItems)
            } else {
                finalResponse.data = finalResponse.data.concat(response.data)
            }

            // Update our potential response
            finalResponse.status = response.status
            if(limit)
                finalResponse.data.length = Math.min(limit, finalResponse.data.length)
        }
        return finalResponse
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
        const responseId = response.headers.location? response.headers.location.split('/')[1] : undefined
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
        query += '?programId=' + params.programId;
        query += '&termId=' + params.termId;
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

const requestPasswordChangeToken = async (email) => {
    const endpoint = "users/token"
    const payload = {'email': email}
    return simpleApiPostRequest(endpoint, payload)
}

const getPasswordChangeToken = async (token) => {
    const endpoint = "users/token/"+token
    return simpleApiGetRequest(endpoint)
}

const changePassword = async (userId, token, newPassword) => {
    const endpoint = "users/"+userId+"/password"
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

const getRemainingCoursesProgram = async (studentId, programId, inputText) => {
    const endpoint = "student/"+studentId+"/remaining-courses/"+programId+"?filter="+inputText;
    return simpleApiGetRequest(endpoint)
}

const getSchedules = async (userId, params) => {
    const query = scheduleParamsToQuery(params)
    const scheduleResponse = await simpleApiGetRequest("student/"+userId+"/schedules"+query)
    if(scheduleResponse.status != OK)
        return scheduleResponse
    for(const schedule of scheduleResponse.data){
        for(let i=0; i < schedule.courseClasses.length; i++){
            const courseClassResponse = await getCourseClass(schedule.courseClasses[i].courseClassId)
            if(courseClassResponse.status != OK)
                return {status: courseClassResponse.status}
            schedule.courseClasses[i] = courseClassResponse.data
        }
    }
    return scheduleResponse
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////// UNIVERSITY FUNCTIONS ////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getUniversities = async (inputText) => {
    return simpleApiMultiPageGetRequest("universities", inputText)
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// BUILDING FUNCTIONS /////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getBuildings = async (universityId, page) => {
    const endpoint = "university/" + universityId + "/buildings?page=" +(page-1)
    return simpleApiGetRequest(endpoint)
}

const getAllBuildings = async (universityId) => {
    return simpleApiMultiPageGetRequest("university/"+universityId+"/buildings")
}

const getBuildingDictionary = async (universityId) => {
    // Get all buildings
    const buildingsResp = await getAllBuildings(universityId)
    if(buildingsResp.status != OK)
        return buildingsResp

    // Build dictionary
    let finalResponse = { data: {} }
    buildingsResp.data.forEach(b => finalResponse.data[b.id] = b)
    finalResponse.status = buildingsResp.status

    return finalResponse
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
    return simpleApiMultiPageGetRequest("/university/"+universityId+"/programs", inputText)
}

const getProgramsPage = async (universityId, page) => {
    const endpoint = "university/" + universityId + "/programs?page=" +(page-1)
    return simpleApiGetRequest(endpoint)
}

const getProgram = async (programId) => {
    return simpleApiGetRequest("program/"+programId)
}

const getMandatoryCourses = async (programId) => {
    return simpleApiMultiPageGetRequest("/program/"+programId+"/courses/mandatory")
}

const getOptionalCourses = async (programId) => {
    return simpleApiMultiPageGetRequest("/program/"+programId+"/courses/optional")
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

const getCoursesNotInList = async (universityId, inputText, courseIDsToFilter, limit) => {
    return simpleApiMultiPageGetRequest("university/" + universityId + "/courses", inputText, MULTI_PAGE_SEARCH_LIMIT, courseIDsToFilter)
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
    return simpleApiMultiPageGetRequest("course/"+courseId+"/requirements/"+programId)
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

const getTerms = async (universityId, page) => {
    const endpoint = "university/" + universityId + "/terms?page=" +(page-1)
    return simpleApiGetRequest(endpoint)
}

const getTerm = async (termId) => {
    return simpleApiGetRequest("term/"+termId)
}

const publishTerm = async (term) => {
    return saveTerm(term.id, term.name, term.internalId, term.startDate, true)
}

const unpublishTerm = async (term) => {
    return saveTerm(term.id, term.name, term.internalId, term.startDate, false)
}

const saveTerm = async (id, name, internalId, startDate, published) => {
    const payload = {
        'name': name,
        'internalId': internalId,
        "startDate": startDate,
        "published": published
    }
    return createOrUpdateObject("term/", payload, id)
}

const deleteTerm = async (term) => {
    return simpleApiDeleteRequest("term/"+term.id)
}


//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// CLASS FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getCourseClassesForTerm = async (courseId, termId, page) => {
    try {
        const endpoint = "course/" + courseId + "/course-classes?termId=" +termId +"&page=" +(page-1)
        const listOfClassesResponse = await api.get(endpoint, AuthService.getRequestHeaders())

        // Load lecture data
        let finalData = []
        for (const c of listOfClassesResponse.data) {
            const courseClassResponse = await getCourseClass(c.id)
            if(courseClassResponse.status !== OK)
                return courseClassResponse
            finalData.push(courseClassResponse.data)
        }
        listOfClassesResponse.data = finalData
        return listOfClassesResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getCourseClass = async (classId) => {
    try {
        const courseClassResponse = await api.get("course-class/"+classId, AuthService.getRequestHeaders())
        const courseClass = courseClassResponse.data

        const courseResponse = await api.get(courseClass.courseUrl, AuthService.getRequestHeaders())
        courseClass.course = courseResponse.data

        const termResponse = await api.get(courseClass.termUrl, AuthService.getRequestHeaders())
        courseClass.term = termResponse.data

        const listOfLecturesResponse = await api.get(courseClass.lecturesUrl, AuthService.getRequestHeaders())
        for (const l of listOfLecturesResponse.data) {
            const buildingDataResponse = await api.get(l.buildingUrl, AuthService.getRequestHeaders())
            l.building = buildingDataResponse.data

            const startTime = l.startTime.split(':')
            const endTime = l.endTime.split(':')
            l.startTime = String(startTime[0]).padStart(2, '0') + ":" + String(startTime[1]).padStart(2, '0')
            l.endTime = String(endTime[0]).padStart(2, '0') + ":" + String(endTime[1]).padStart(2, '0')
            l.day = DAYS[l.day]
        }
        courseClass.lectures = listOfLecturesResponse.data
        return courseClassResponse
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const saveCourseClass = async (id, courseId, termId, name, lectures) => {
    let formattedLectures = []
    lectures.forEach((l) => formattedLectures.push(Object.assign({}, l)))
    formattedLectures.forEach((l) => l.day = DAYS.indexOf(l.day))
    const payload = {
        courseId: courseId,
        termId: termId,
        name: name,
        lectures: formattedLectures
    }
    return createOrUpdateObject("course-class/", payload, id)
}

const deleteCourseClass = async (courseClassId) => {
    return simpleApiDeleteRequest("course-class/"+courseClassId)
}


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
    requestPasswordChangeToken: requestPasswordChangeToken,
    getPasswordChangeToken: getPasswordChangeToken,
    changePassword: changePassword,

    getStudent: getStudent,
    getFinishedCourses: getFinishedCourses,
    addFinishedCourse: addFinishedCourse,
    deleteFinishedCourse: deleteFinishedCourse,
    getRemainingCoursesProgram: getRemainingCoursesProgram,
    getSchedules: getSchedules,
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

    getTerms: getTerms,
    getTerm: getTerm,
    publishTerm: publishTerm,
    unpublishTerm: unpublishTerm,
    saveTerm: saveTerm,
    deleteTerm: deleteTerm,

    getCourseClassesForTerm: getCourseClassesForTerm,
    getCourseClass: getCourseClass,
    saveCourseClass: saveCourseClass,
    deleteCourseClass: deleteCourseClass,
};

export default ApiService;
