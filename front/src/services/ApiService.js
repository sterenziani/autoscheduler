import { CREATED, OK, NO_CONTENT, INTERNAL_ERROR, TIMEOUT, TIMEOUT_ERROR, CONNECTION_ERROR, SERVICE_UNAVAILABLE } from '../resources/ApiConstants';
import { DAYS, EXTRA_SUPPORTED, SUPPORTED_LOWER_LIMIT, SUPPORTED_UPPER_LIMIT } from '../resources/SystemConstants';
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
const studentUniversityProgramsEndpoint = "student/university/programs"
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
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const longApiGetRequest = async (endpoint) => {
    try {
        return await api.get(endpoint, {...AuthService.getRequestHeaders(), timeout: 15*MINUTE_IN_MS})
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const simpleApiMultiPageGetRequest = async (baseEndpoint, params, limit, idsToFilter) => {
    try {
        let page = 1
        let lastPage = 1
        const finalResponse = {data: []}

        let additionalQuery = ""
        if(params){
            for (const [key, value] of Object.entries(params)){
                additionalQuery = `${additionalQuery}&${key}=${value}`
            }
        }

        while(page <= lastPage && (!limit || finalResponse.data.length < limit)) {
            const endpoint = `${baseEndpoint}?page=${page}${additionalQuery}`
            const response = await api.get(endpoint, AuthService.getRequestHeaders())
            if(response.status !== OK) return response

            // Process page data (last is checked every time in case one has been added after first page was read)
            const links = parsePagination(response, page)
            page = page+1
            if(links && links.last)
                lastPage = links.last

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
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        else return { status: INTERNAL_ERROR }
    }
}

const simpleApiPostRequest = async (endpoint, body) => {
    try {
        return await api.post(endpoint, body, AuthService.getRequestHeaders())
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const simpleApiPutRequest = async (endpoint, body) => {
    try {
        return await api.put(endpoint, body, AuthService.getRequestHeaders())
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const simpleApiDeleteRequest = async (endpoint) => {
    try {
        const config = AuthService.getRequestHeaders()
        return await api.delete(endpoint, config)
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
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
        const splitLocation = response.headers?.location?.split('/')
        const responseId = splitLocation? splitLocation[splitLocation.length-1] : id
        return { status: successStatus, id: responseId }
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const parsePagination = (response, page) => {
    let arrData = response.headers.link
    const links = {}

    if(arrData){
        arrData = arrData.split(",")
        for (var d of arrData){
            const linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/ig.exec(d)
            const pageNumber = parseInt(linkInfo[1].split("page=")[1].match(/\d+/))
            links[linkInfo[2]] = pageNumber
        }
    }

    // Only 1 page
    if(links.prev === links.next){
        delete links['prev']
        delete links['next']
        return links
    }

    // Currently on page 1
    if(page === links.first)
        delete links['prev']
    // Currently on last page
    if(page === links.last)
        delete links['next']

    return links
}

const scheduleParamsToQuery = (params) => {
    let query = '';
    if (params) {
        query += '?termId=' + params.termId;
        query += '&programId=' + params.programId;
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

const getIdFromURL = (url, universityEndpoint) => {
    const partialPrefixString = AuthService.isActiveUserStudent()? studentUniversityPrefix:''
    const fullPrefixString = `/api/${partialPrefixString}${universityEndpoint}/`
    return url.replace(fullPrefixString, '')
}

const cleanInputText = (inputText) => {
    const foundInvalidCharacters = new Set()
    for (const c of inputText) {
        if(!isValidCharacter(c))
            foundInvalidCharacters.add(c)
    }

    // Ignore all non-supported characters
    for(const c of foundInvalidCharacters)
        inputText = inputText.replace(c, '')
    return inputText
}

const isValidCharacter = (c) => {
    const charCode = c.charCodeAt(0)
    if(charCode >= SUPPORTED_LOWER_LIMIT && charCode <= SUPPORTED_UPPER_LIMIT)
        return true
    if(EXTRA_SUPPORTED.includes(charCode))
        return true
    return false
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
    const endpoint = `${passwordRecoveryTokensEndpoint}/${token}`
    return simpleApiGetRequest(endpoint)
}

const changePassword = async (token, newPassword) => {
    const endpoint = `${passwordRecoveryTokensEndpoint}/${token}`
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
            if(resp.status !== OK) return resp
            user = resp.data
        }

        const universityResponse = await api.get(studentUniversityEndpoint, AuthService.getRequestHeaders())
        if(universityResponse.status !== OK)
            return universityResponse

        const programResponse = await api.get(studentProgramEndpoint, AuthService.getRequestHeaders())
        if(programResponse.status !== OK)
            return programResponse

        const resp = {
            ...user,
            university: universityResponse.data,
        }
        if(programResponse.data)
            resp.program = programResponse.data

        return {status: OK, data: resp}
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const getFinishedCourses = async (page) => {
    const endpoint = studentCompletedCoursesEndpoint +`?page=${page}`
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
    const endpoint = `${studentUniversityProgramsEndpoint}/${programId}/remaining-courses`
    return simpleApiMultiPageGetRequest(endpoint, {filter: cleanInputText(inputText)}, MULTI_PAGE_SEARCH_LIMIT)
}

const getSchedules = async (params) => {
    const query = scheduleParamsToQuery(params)
    const scheduleResponse = await longApiGetRequest(studentSchedulesEndpoint + query)
    if(scheduleResponse.status !== OK)
        return scheduleResponse

    const courseClassCache = {}
    const courseCache = {}
    const buildingCache = {}
    for(const schedule of scheduleResponse.data){
        for(let i=0; i < schedule.courseClasses.length; i++){
            const ccId = schedule.courseClasses[i].courseClassId
            if(!courseClassCache[ccId]){
                const courseClassResponse = await getCourseClass(ccId, true, false, true, courseCache, buildingCache)
                if(courseClassResponse.status !== OK)
                    return {status: courseClassResponse.status}
                courseClassCache[ccId] = courseClassResponse.data
            }
            schedule.courseClasses[i] = courseClassCache[ccId]
        }
    }
    return scheduleResponse
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////// UNIVERSITY FUNCTIONS ////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getUniversities = async (inputText) => {
    return simpleApiMultiPageGetRequest(universitiesEndpoint, {filter: cleanInputText(inputText), verified: true})
}

const getUniversityUsersPage = async (page, inputText) => {
    let endpoint = `${universitiesEndpoint}?page=${page}`
    if(inputText && cleanInputText(inputText).length > 0) endpoint += `&filter=${cleanInputText(inputText)}`
    return simpleApiGetRequest(endpoint)
}

const verifyUniversity = async (universityId) => {
    const endpoint = getEndpointForActiveUser(`${universitiesEndpoint}/${universityId}`)
    const payload =  {verified: true}
    return simpleApiPutRequest(endpoint, payload)
}

const unverifyUniversity = async (universityId) => {
    const endpoint = getEndpointForActiveUser(`${universitiesEndpoint}/${universityId}`)
    const payload = {verified: false}
    return simpleApiPutRequest(endpoint, payload)
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// BUILDING FUNCTIONS /////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const getBuildingsPage = async (page) => {
    const endpoint = getEndpointForActiveUser(`${universityBuildingsEndpoint}?page=${page}`)
    return simpleApiGetRequest(endpoint)
}

const getBuildings = async () => {
    const endpoint = getEndpointForActiveUser(universityBuildingsEndpoint)
    return await simpleApiMultiPageGetRequest(endpoint)
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
    const buildingResponse = await simpleApiGetRequest(endpoint)
    if(buildingResponse.status !== OK)
        return buildingResponse

    const distancesResponse = await simpleApiGetRequest(`${endpoint}/distances`)
    if(distancesResponse.status !== OK)
        return distancesResponse
    buildingResponse.data.distances = distancesResponse.data
    return buildingResponse
}

const saveBuilding = async (id, name, internalId, distances) => {
    const payload = {
        'name': name,
        'internalId': internalId,
    }
    const response = await createOrUpdateObject(universityBuildingsEndpoint, payload, id)
    if(response.status !== OK && response.status !== CREATED)
        return response


    // Once created/updated, define distances
    const distanceEndpoint = `${universityBuildingsEndpoint}/${response.id}/distances-collection`
    const distancePayload = { "distances": {} }
    for (const pair of Object.values(distances)){
        distancePayload.distances[pair.building.id] = pair.time
    }

    const distanceResponse = await simpleApiPutRequest(distanceEndpoint, distancePayload)
    if(distanceResponse.status !== NO_CONTENT && distanceResponse.status !== OK && distanceResponse.status !== CREATED)
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
    return simpleApiMultiPageGetRequest(`${universitiesEndpoint}/${universityId}/programs`, {filter: cleanInputText(inputText)})
}

const getPrograms = async (inputText='') => {
    const endpoint = getEndpointForActiveUser(universityProgramsEndpoint)
    return simpleApiMultiPageGetRequest(endpoint, {filter: cleanInputText(inputText)})
}

const getProgramsPage = async (page) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}?page=${page}`)
    return simpleApiGetRequest(endpoint)
}

const getProgram = async (programId) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}`)
    return simpleApiGetRequest(endpoint)
}

const getMandatoryCourses = async (programId, withRequiredCredits) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}/courses`)
    const response = await simpleApiMultiPageGetRequest(endpoint, {optional: false})
    if(response.status !== OK || !withRequiredCredits)
        return response

    for(const c of response.data){
        const requiredCreditsResponse = await simpleApiGetRequest(`${universityProgramsEndpoint}/${programId}/courses/${c.id}/required-credits`)
        if(requiredCreditsResponse.status !== OK)
            return requiredCreditsResponse
        c.requiredCredits = requiredCreditsResponse.data.requiredCredits?? 0
    }
    return response
}

const getOptionalCourses = async (programId, withRequiredCredits) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}/courses`)
    const response = await simpleApiMultiPageGetRequest(endpoint, {optional: true})
    if(response.status !== OK || !withRequiredCredits)
        return response

    for(const c of response.data){
        const requiredCreditsResponse = await simpleApiGetRequest(`${universityProgramsEndpoint}/${programId}/courses/${c.id}/required-credits`)
        if(requiredCreditsResponse.status !== OK)
            return requiredCreditsResponse
        c.requiredCredits = requiredCreditsResponse.data.requiredCredits?? 0
    }
    return response
}

const saveProgram = async (id, name, internalId, optionalCourseCredits, mandatoryCourseIDs, optionalCourseIDs, creditRequirements) => {
    const payload = {
        'name': name,
        'internalId': internalId,
        'optionalCourseCredits': Number(optionalCourseCredits)?? 0,
    }
    const response = await createOrUpdateObject(universityProgramsEndpoint, payload, id)
    if(response.status !== OK && response.status !== CREATED)
        return response


    // Once created/updated, define courses
    const coursesEndpoint = `${universityProgramsEndpoint}/${response.id}/courses-collection`
    const coursesPayload = { "mandatoryCourses": mandatoryCourseIDs, "optionalCourses": optionalCourseIDs, "creditRequirements": creditRequirements }
    const coursesResponse = await simpleApiPutRequest(coursesEndpoint, coursesPayload)

    if(coursesResponse.status !== NO_CONTENT && coursesResponse.status !== OK && coursesResponse.status !== CREATED)
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
    const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}`)
    return simpleApiMultiPageGetRequest(endpoint, {filter: cleanInputText(inputText)}, MULTI_PAGE_SEARCH_LIMIT)
}

const getCoursesPage = async (page, inputText) => {
    let endpoint = `${universityCoursesEndpoint}?page=${page}`
    if(inputText) endpoint += `&filter=${cleanInputText(inputText)}`
    endpoint = getEndpointForActiveUser(endpoint)
    return simpleApiGetRequest(endpoint)
}

const getCoursesNotInList = async (inputText, courseIDsToFilter) => {
    const endpoint = getEndpointForActiveUser(universityCoursesEndpoint)
    return simpleApiMultiPageGetRequest(endpoint, {filter: cleanInputText(inputText)}, MULTI_PAGE_SEARCH_LIMIT, courseIDsToFilter)
}

const getCourse = async (courseId) => {
    const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}/${courseId}`)
    return simpleApiGetRequest(endpoint)
}

const getRequiredCoursesForProgram = async (courseId, programId) => {
    const endpoint = getEndpointForActiveUser(`${universityProgramsEndpoint}/${programId}/courses/${courseId}/required-courses`)
    return simpleApiMultiPageGetRequest(endpoint)
}

const getProgramsCourseIsIn = async (courseId, inputText) => {
    const endpoint = getEndpointForActiveUser(universityProgramsEndpoint)
    return simpleApiMultiPageGetRequest(endpoint, {filter: cleanInputText(inputText), courseId: courseId})
}

const saveCourse = async (id, name, internalId, creditValue, programsData, requirementIDs) => {
    const payload = {
        'name': name,
        'internalId': internalId,
        'creditValue': Number(creditValue)?? 0,
    }
    const response = await createOrUpdateObject(universityCoursesEndpoint, payload, id)
    if(response.status !== OK && response.status !== CREATED)
        return response

    // Once created, update programs
    if(response.status === CREATED){
        for(const [programId, programData] of Object.entries(programsData)) {
            if(programData.isIn){
                const programsEndpoint = `${universityProgramsEndpoint}/${programId}/courses`
                const programsPayload = { "courseId": response.id, "optional": programData.isOptional, "requiredCredits": programData.requiredCredits }
                const programsResponse = await simpleApiPostRequest(programsEndpoint, programsPayload)
                if(programsResponse.status !== CREATED && programsResponse.status !== NO_CONTENT)
                    return programsResponse
            }
        }
    }

    // Once updated, define requirements
    if(response.status === OK){
        for(const [programId, requirementsInProgram] of Object.entries(requirementIDs)) {
            const requirementsEndpoint = `${universityProgramsEndpoint}/${programId}/courses/${response.id}/required-courses-collection`
            const requirementsPayload = { "requirements": requirementsInProgram }
            const requirementsResponse = await simpleApiPutRequest(requirementsEndpoint, requirementsPayload)
            if(requirementsInProgram.length > 1 && requirementsResponse.status !== OK && requirementsResponse.status !== NO_CONTENT)
                return requirementsResponse
        }
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

const getTerms = async (page=1, publishedStatus) => {
    let endpoint = getEndpointForActiveUser(`${universityTermsEndpoint}?page=${page}`)
    if(publishedStatus !== undefined)
        endpoint = endpoint + `&published=${publishedStatus}`
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

const getCourseClassesForTerm = async (courseId, termId, page, populateCourse=false, populateTerm=false, populateLectures=true, courseCache={}, buildingCache={}) => {
    try {
        const endpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}/${courseId}/course-classes?termId=${termId}&page=${page}`)
        const listOfClassesResponse = await simpleApiGetRequest(endpoint)

        // Load lecture data
        const finalData = []
        for (const cc of listOfClassesResponse.data) {
            const courseClassResponse = await populateCourseClass(cc, populateCourse, populateTerm, true, courseCache, buildingCache)
            if(courseClassResponse.status !== OK) return courseClassResponse
            finalData.push(courseClassResponse.data)
        }
        listOfClassesResponse.data = finalData
        return listOfClassesResponse
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const getCourseClass = async (classId, populateCourse=false, populateTerm=false, populateLectures=true, courseCache={}, buildingCache={}) => {
    try {
        const courseClassEndpoint = getEndpointForActiveUser(`${universityClassesEndpoint}/${classId}`)
        const courseClassResponse = await simpleApiGetRequest(courseClassEndpoint)
        if(courseClassResponse.status !== OK) return courseClassResponse

        const courseClass = courseClassResponse.data
        const populateCourseClassResponse = await populateCourseClass(courseClass, populateCourse, populateTerm, populateLectures, courseCache, buildingCache)
        if(populateCourseClassResponse.status !== OK) return populateCourseClassResponse
        return courseClassResponse
    }
    catch(e) {
        if (e.response) return e.response
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        if (e.code && e.code === CONNECTION_ERROR) return { status: SERVICE_UNAVAILABLE }
        else return { status: INTERNAL_ERROR }
    }
}

const populateCourseClass = async (courseClass, course=false, term=false, lectures=true, courseCache={}, buildingCache={}) => {
    if(course){
        const courseId = getIdFromURL(courseClass.courseUrl, universityCoursesEndpoint)
        if(!courseCache[courseId]){
            const courseEndpoint = getEndpointForActiveUser(`${universityCoursesEndpoint}/${courseId}`)
            const courseResponse = await simpleApiGetRequest(courseEndpoint)
            if(courseResponse.status !== OK) return courseResponse
            courseCache[courseId] = courseResponse.data
        }
        courseClass.course = courseCache[courseId]
    }

    if(term){
        const termId = getIdFromURL(courseClass.termUrl, universityTermsEndpoint)
        const termEndpoint = getEndpointForActiveUser(`${universityTermsEndpoint}/${termId}`)
        const termResponse = await simpleApiGetRequest(termEndpoint)
        if(termResponse.status !== OK) return termResponse
        courseClass.term = termResponse.data
    }

    if(lectures){
        const lecturesResponse = await getLectures(courseClass.id, buildingCache)
        courseClass.lectures = lecturesResponse.data
    }

    return {status: OK, data: courseClass}
}

const getLectures = async (courseClassId, buildingCache={}) => {
    const lecturesEndpoint = getEndpointForActiveUser(`${universityClassesEndpoint}/${courseClassId}/lectures`)
    const listOfLecturesResponse = await simpleApiGetRequest(lecturesEndpoint)
    if(listOfLecturesResponse.status !== OK) return listOfLecturesResponse

    for (const l of listOfLecturesResponse.data) {
        if(l.buildingUrl){
            const buildingId = getIdFromURL(l.buildingUrl, universityBuildingsEndpoint)
            if(!buildingCache[buildingId]){
                const buildingEndpoint = getEndpointForActiveUser(`${universityBuildingsEndpoint}/${buildingId}`)
                const buildingResponse = await simpleApiGetRequest(buildingEndpoint)
                if(buildingResponse.status !== OK) return buildingResponse
                buildingCache[buildingId] = buildingResponse.data
            }
            l.building = buildingCache[buildingId]
        }
        l.day = DAYS[l.day]
    }
    return listOfLecturesResponse
}

const saveCourseClass = async (id, courseId, termId, name, lecturesToCreate, lecturesToUpdate, lecturesToDelete) => {
    const payload = {
        termId: termId,
        name: name
    }
    const endpoint = `${universityCoursesEndpoint}/${courseId}/course-classes`
    const response = await createOrUpdateObject(endpoint, payload, id)
    if(response.status !== OK && response.status !== CREATED)
        return response

    // Once created/updated, define lectures
    const lecturesEndpoint = `${universityClassesEndpoint}/${response.id}/lectures`

    let formattedLectures = []
    lecturesToUpdate.forEach((l) => formattedLectures.push(Object.assign({}, l)))
    formattedLectures.forEach((l) => l.day = DAYS.indexOf(l.day))
    for(const l of formattedLectures) {
        const lecturePayload = { "day": l.day, "startTime": l.startTime, "endTime": l.endTime, "buildingId": l.building.id }
        const lectureResponse = await simpleApiPutRequest(`${lecturesEndpoint}/${l.id}`, lecturePayload)
        if(lectureResponse.status !== OK)
            return lectureResponse
    }

    formattedLectures = []
    lecturesToCreate.forEach((l) => formattedLectures.push(Object.assign({}, l)))
    formattedLectures.forEach((l) => l.day = DAYS.indexOf(l.day))
    for(const l of formattedLectures) {
        const lecturePayload = { "day": l.day, "startTime": l.startTime, "endTime": l.endTime, "buildingId": l.building.id }
        const lectureResponse = await simpleApiPostRequest(lecturesEndpoint, lecturePayload)
        if(lectureResponse.status !== CREATED)
            return lectureResponse
    }

    for(const l of lecturesToDelete) {
        const lectureResponse = await simpleApiDeleteRequest(`${lecturesEndpoint}/${l.id}`)
        if(lectureResponse.status !== NO_CONTENT)
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
    getUniversityUsersPage:getUniversityUsersPage,
    verifyUniversity:verifyUniversity,
    unverifyUniversity:unverifyUniversity,

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
    getProgramsCourseIsIn: getProgramsCourseIsIn,
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
