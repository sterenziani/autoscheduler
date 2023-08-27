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

// TODO: Placeholder. This should be a call to API's getRemainingCoursesProgram, filtering results by program and removing those already finished by the user
const getRemainingCoursesProgram = async (user, programId, inputText) => {
    // TODO: Fix
    const mandatoryCoursesResp = await getMandatoryCourses(programId)
    if(mandatoryCoursesResp.status != OK)
        return mandatoryCoursesResp

    const optionalCoursesResp = await getOptionalCourses(programId)
    if(optionalCoursesResp.status != OK)
        return optionalCoursesResp

    return {status: OK, data: [...mandatoryCoursesResp.data, ...optionalCoursesResp.data]}
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

// TODO: Implement me
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

// TODO: Implement me
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

// TODO: Implement me
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

    getTerms: getTerms,
    getTerm: getTerm,
    publishTerm: publishTerm,
    unpublishTerm: unpublishTerm,
    saveTerm: saveTerm,
    deleteTerm: deleteTerm,

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
