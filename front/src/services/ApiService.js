import { CREATED, TIMEOUT, OK } from './ApiConstants';
import { DAYS } from './SystemConstants';
import api from './api'
import AuthService from './AuthService'
const MULTI_PAGE_SEARCH_LIMIT = 20;
const MINUTE_IN_MS = 60000;

//////////////////////////
/// ENDPOINT CONSTANTS ///
//////////////////////////

const passwordRecoveryTokensEndpoint = "auth/password-recovery-tokens"

const studentsEndpoint = "students"
const studentUniversityPrefix = "student/"
const studentUniversityEndpoint = "student/university"
const studentProgramEndpoint = "student/program"
const studentCompletedCoursesEndpoint = "student/completed-courses"
const studentRemainingCoursesEndpoint = "student/remaining-courses"
const studentSchedulesEndpoint = "student/schedules"

const universitiesEndpoint = "universities"
const universityBuildingsEndpoint = "university/buildings"
const universityProgramsEndpoint = "university/programs"
const universityCoursesEndpoint = "university/courses"
const universityTermsEndpoint = "university/terms"
const universityClassesEndpoint = "university/course-classes"

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

const longApiGetRequest = async (endpoint) => {
    try {
        return await api.get(endpoint, {...AuthService.getRequestHeaders(), timeout: 15*MINUTE_IN_MS})
    }
    catch(e) {
        if (e.response) return { status: e.response.status }
        else return { status: TIMEOUT }
    }
}

const simpleApiMultiPageGetRequest = async (baseEndpoint, params, limit, idsToFilter) => {
    try {
        let page = 0
        let lastPage = 0
        const finalResponse = {data: []}

        let additionalQuery = ""
        for (const [key, value] of Object.entries(params))
            additionalQuery = `${additionalQuery}&${key}=${value}`

        while(page <= lastPage && (!limit || finalResponse.data.length < limit)) {
            const endpoint = `${baseEndpoint}?page=${page}${additionalQuery}`
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

const simpleApiDeleteRequest = async (endpoint) => {
    try {
        const config = AuthService.getRequestHeaders()
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
            endpoint = `${baseEndpoint}/${id}`
            successStatus = OK
            response = await api.put(endpoint, body, AuthService.getRequestHeaders())
        } else {
            response = await api.post(endpoint, body, AuthService.getRequestHeaders())
        }
        const responseId = response.headers.location? response.headers.location.split('/')[1] : id
        return { status: successStatus, id: responseId }
    }
    catch(e) {
        if (e.response) return e.response
        else return { status: TIMEOUT }
    }
}

const parsePagination = (response) => {
    let arrData = response.headers.link
    const links = {}

    if(arrData){
        arrData = arrData.split(",")
        for (var d of arrData){
            const linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/ig.exec(d)
            links[linkInfo[2]] = api.defaults.baseURL + "/" + linkInfo[1]
        }
    }
    return links
}

const scheduleParamsToQuery = (params) => {
    let query = '';
    if (params) {
        query += '?termId=' + params.termId;
        query += '&targetHours=' + params.hours;
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

const getEndpointForActiveUser = (endpoint) => {
    return (AuthService.isActiveUserStudent()? studentUniversityPrefix:"") + endpoint
}

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
    const payload = {'email': email}
    return simpleApiPostRequest(passwordRecoveryTokensEndpoint, payload)
}

const getPasswordChangeToken = async (token) => {
    return simpleApiGetRequest(passwordRecoveryTokensEndpoint)
}

const changePassword = async (userId, token, newPassword) => {
    const endpoint = passwordRecoveryTokensEndpoint + token
    const payload = {'password': newPassword}
    return simpleApiPutRequest(endpoint, payload)
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// STUDENT FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getStudent = async (studentId) => {
    try{
        let user = getActiveUser()
        if(user.id !== studentId){
            const endpoint = studentsEndpoint + studentId
            const resp = await api.get(endpoint, AuthService.getRequestHeaders())
            user = resp.data
        }

        const universityResponse = await api.get(studentUniversityEndpoint, AuthService.getRequestHeaders())
        const programResponse = await api.get(studentProgramEndpoint, AuthService.getRequestHeaders())

        const resp = {
            ...user,
            university: universityResponse.data,
        }
        if(programResponse.data)
            resp.program = programResponse.data

        return resp
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const getFinishedCourses = async (page) => {
    const endpoint = studentCompletedCoursesEndpoint +`?page=${page-1}`
    return simpleApiGetRequest(endpoint)
}

const addFinishedCourse = async (courseId) => {
    const body = { courseId: courseId }
    return simpleApiPostRequest(studentCompletedCoursesEndpoint, body)
}

const deleteFinishedCourse = async (courseId) => {
    const endpoint = `${studentCompletedCoursesEndpoint}/${courseId}`
    return simpleApiDeleteRequest(endpoint)
}

const getRemainingCoursesProgram = async (programId, inputText) => {
    const endpoint = `${studentRemainingCoursesEndpoint}?programId=${programId}&filter=${inputText}`
    return simpleApiGetRequest(endpoint)
}

const getSchedules = async (params) => {
    const query = scheduleParamsToQuery(params)
    const scheduleResponse = await longApiGetRequest(studentSchedulesEndpoint + query)
    if(scheduleResponse.status !== OK)
        return scheduleResponse
    for(const schedule of scheduleResponse.data){
        for(let i=0; i < schedule.courseClasses.length; i++){
            const courseClassResponse = await getCourseClass(schedule.courseClasses[i].courseClassId)
            if(courseClassResponse.status !== OK)
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
    return simpleApiMultiPageGetRequest(universitiesEndpoint, {filter: inputText, verified: true})
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// BUILDING FUNCTIONS /////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getBuildingsPage = async (page) => {
    const endpoint = getEndpointForActiveUser(`${universityBuildingsEndpoint}?page=${page-1}`)
    return simpleApiGetRequest(endpoint)
}

const getBuildings = async () => {
    const endpoint = getEndpointForActiveUser(universityBuildingsEndpoint)
    return simpleApiMultiPageGetRequest(endpoint)
}

const getBuildingDictionary = async () => {
    // Get all buildings
    const buildingsResp = await getBuildings()
    if(buildingsResp.status !== OK)
        return buildingsResp

    // Build dictionary
    const finalResponse = { data: {} }
    buildingsResp.data.forEach(b => finalResponse.data[b.id] = b)
    finalResponse.status = buildingsResp.status

    return finalResponse
}

const getBuilding = async (buildingId) => {
    const endpoint = getEndpointForActiveUser(`${universityBuildingsEndpoint}/${buildingId}`)
    return simpleApiGetRequest(endpoint)
}

const saveBuilding = async (id, name, internalId, distances) => {
    const payload = {
        'name': name,
        'internalId': internalId,
    }
    const response = await createOrUpdateObject(universityBuildingsEndpoint, payload, id)
    if(response !== OK || response !== CREATED)
        return response


    // Once created/updated, define distances
    const distanceEndpoint = `${universityBuildingsEndpoint}/${response.id}/distances-collection`
    const distancePayload = { "distances": {} }
    for (const pair of Object.values(distances))
        distancePayload.distances[pair.building.id] = pair.time

    const distanceResponse = await simpleApiPutRequest(distanceEndpoint, distancePayload)
    if(distanceResponse !== OK || distanceResponse !== CREATED)
        return distanceResponse
    return response
}

const deleteBuilding = async (buildingId) => {
    const endpoint = `${universityBuildingsEndpoint}/${buildingId}`
    return simpleApiDeleteRequest(endpoint)
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// PROGRAM FUNCTIONS /////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getProgramsOfUniversity = async (universityId, inputText) => {
    return simpleApiMultiPageGetRequest(`${universitiesEndpoint}/${universityId}/programs`, {filter: inputText})
}

const getPrograms = async (inputText) => {
    const endpoint = getEndpointForActiveUser(universityProgramsEndpoint)
    return simpleApiMultiPageGetRequest(endpoint, {filter: inputText})
}

const getProgramsPage = async (page) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}?page=${page-1}`)
    return simpleApiGetRequest(endpoint)
}

const getProgram = async (programId) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}`)
    return simpleApiGetRequest(endpoint)
}

const getMandatoryCourses = async (programId) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}/courses`)
    return simpleApiMultiPageGetRequest(endpoint, {optional: false})
}

const getOptionalCourses = async (programId) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}/courses`)
    return simpleApiMultiPageGetRequest(endpoint, {optional: true})
}

const saveProgram = async (id, name, internalId, mandatoryCourseIDs, optionalCourseIDs) => {
    const payload = {
        'name': name,
        'internalId': internalId
    }
    const response = await createOrUpdateObject(universityProgramsEndpoint, payload, id)
    if(response !== OK || response !== CREATED)
        return response


    // Once created/updated, define courses
    const coursesEndpoint = `${universityProgramsEndpoint}/${response.id}/courses-collection`
    const coursesPayload = { "mandatoryCourses": mandatoryCourseIDs, "optionalCourses": optionalCourseIDs }
    const coursesResponse = await simpleApiPutRequest(coursesEndpoint, coursesPayload)

    if(coursesResponse !== OK || coursesResponse !== CREATED)
        return coursesResponse
    return response
}

const deleteProgram = async (programId) => {
    const endpoint = `${universityProgramsEndpoint}/${programId}`
    return simpleApiDeleteRequest(endpoint)
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// COURSE FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getCourses = async (inputText) => {
    const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}?filter=${inputText}`)
    return simpleApiMultiPageGetRequest(endpoint)
}

const getCoursesPage = async (page) => {
    const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}?page=${page-1}`)
    return simpleApiGetRequest(endpoint)
}

const getCoursesNotInList = async (inputText, courseIDsToFilter) => {
    const endpoint = getEndpointForActiveUser(universityCoursesEndpoint)
    return simpleApiMultiPageGetRequest(endpoint, {filter: inputText}, MULTI_PAGE_SEARCH_LIMIT, courseIDsToFilter)
}

const getCourse = async (courseId) => {
    const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}/${courseId}`)
    return simpleApiGetRequest(endpoint)
}

const getRequiredCoursesForProgram = async (courseId, programId) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}/courses/${courseId}/required-courses`)
    return simpleApiMultiPageGetRequest(endpoint)
}

const saveCourse = async (id, name, internalId, requirementIDs) => {
    const payload = {
        'name': name,
        'internalId': internalId
    }
    const response = createOrUpdateObject(universityCoursesEndpoint, payload, id)
    if(response !== OK || response !== CREATED)
        return response

    // Once created/updated, define requirements
    for(const [programId, requirementsInProgram] of Object.entries(requirementIDs)) {
        const requirementsEndpoint = `${universityProgramsEndpoint}/${programId}/courses/${response.id}/required-courses-collection`
        const requirementsPayload = { "requirements": requirementsInProgram }
        const requirementsResponse = await simpleApiPutRequest(requirementsEndpoint, requirementsPayload)
        if(requirementsResponse !== OK || requirementsResponse !== CREATED)
            return requirementsResponse
    }
    return response
}

const deleteCourse = async (courseId) => {
    const endpoint = `${universityCoursesEndpoint}/${courseId}`
    return simpleApiDeleteRequest(endpoint)
}

//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// TERM FUNCTIONS ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getTerms = async (page=1) => {
    const endpoint = getEndpointForActiveUser(`${universityTermsEndpoint}?page=${page-1}`)
    return simpleApiGetRequest(endpoint)
}

const getTerm = async (termId) => {
    const endpoint = getEndpointForActiveUser(`${universityTermsEndpoint}/${termId}`)
    return simpleApiGetRequest(endpoint)
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
    const endpoint = universityTermsEndpoint
    return createOrUpdateObject(endpoint, payload, id)
}

const deleteTerm = async (termId) => {
    const endpoint = `${universityTermsEndpoint}/${termId}`
    return simpleApiDeleteRequest(endpoint)
}


//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// CLASS FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getCourseClassesForTerm = async (courseId, termId, page) => {
    try {
        const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}/${courseId}/course-classes?termId=${termId}&page=${page-1}`)
        const listOfClassesResponse = await api.get(endpoint, AuthService.getRequestHeaders())

        // Load lecture data
        const finalData = []
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
        const courseClassEndpoint = getEndpointForActiveUser(`${universityClassesEndpoint}/${classId}`)
        const courseClassResponse = await api.get(courseClassEndpoint, AuthService.getRequestHeaders())
        const courseClass = courseClassResponse.data

        const courseResponse = await api.get(courseClass.courseUrl, AuthService.getRequestHeaders())
        courseClass.course = courseResponse.data

        const termResponse = await api.get(courseClass.termUrl, AuthService.getRequestHeaders())
        courseClass.term = termResponse.data

        const listOfLecturesResponse = await api.get(courseClass.lecturesUrl, AuthService.getRequestHeaders())
        for (const l of listOfLecturesResponse.data) {
            if(l.buildingUrl){
                const buildingDataResponse = await api.get(l.buildingUrl, AuthService.getRequestHeaders())
                l.building = buildingDataResponse.data
            }

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

const saveCourseClass = async (id, courseId, termId, name, lecturesToCreate, lecturesToUpdate, lecturesToDelete) => {
    const payload = {
        termId: termId,
        name: name
    }
    const endpoint = `${universityCoursesEndpoint}/${courseId}/course-classes`
    const response = createOrUpdateObject(endpoint, payload, id)
    if(response !== OK || response !== CREATED)
        return response

    // Once created/updated, define lectures
    const lecturesEndpoint = `${universityClassesEndpoint}/${response.id}/lectures`

    for(const l of lecturesToUpdate) {
        const formattedLectures = []
        lecturesToUpdate.forEach((l) => formattedLectures.push(Object.assign({}, l)))
        formattedLectures.forEach((l) => l.day = DAYS.indexOf(l.day))

        const lecturePayload = { "day": l.day, "startTime": l.startTime, "endTime": l.endTime, "buildingId": l.buildingId }
        const lectureResponse = await simpleApiPutRequest(`${lecturesEndpoint}/${l.id}`, lecturePayload)
        if(lectureResponse !== OK || lectureResponse !== CREATED)
            return lectureResponse
    }

    for(const l of lecturesToCreate) {
        const formattedLectures = []
        lecturesToCreate.forEach((l) => formattedLectures.push(Object.assign({}, l)))
        formattedLectures.forEach((l) => l.day = DAYS.indexOf(l.day))

        const lecturePayload = { "day": l.day, "startTime": l.startTime, "endTime": l.endTime, "buildingId": l.buildingId }
        const lectureResponse = await simpleApiPostRequest(lecturesEndpoint, lecturePayload)
        if(lectureResponse !== OK || lectureResponse !== CREATED)
            return lectureResponse
    }

    for(const l of lecturesToDelete) {
        const lectureResponse = await simpleApiDeleteRequest(`${lecturesEndpoint}/${l.id}`)
        if(lectureResponse !== OK || lectureResponse !== CREATED)
            return lectureResponse
    }

    return response
}

const deleteCourseClass = async (courseClassId) => {
    const endpoint = `${universityClassesEndpoint}/${courseClassId}`
    return simpleApiDeleteRequest(endpoint)
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
    getBuildingsPage: getBuildingsPage,
    getBuildingDictionary: getBuildingDictionary,
    getBuilding: getBuilding,
    saveBuilding: saveBuilding,
    deleteBuilding: deleteBuilding,

    getPrograms: getPrograms,
    getProgramsOfUniversity: getProgramsOfUniversity,
    getProgramsPage: getProgramsPage,
    getProgram: getProgram,
    getMandatoryCourses: getMandatoryCourses,
    getOptionalCourses: getOptionalCourses,
    saveProgram: saveProgram,
    deleteProgram: deleteProgram,

    getCourses: getCourses,
    getCoursesNotInList: getCoursesNotInList,
    getCoursesPage: getCoursesPage,
    getCourse: getCourse,
    getRequiredCoursesForProgram: getRequiredCoursesForProgram,
    saveCourse: saveCourse,
    deleteCourse: deleteCourse,

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
