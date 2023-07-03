import { CREATED, CONFLICT, TIMEOUT, NOT_FOUND, OK } from './ApiConstants';
import SgaConstants from '../resources/SgaConstants';
import api from './api'
import AuthService from './AuthService'
const RESOLVE_DELAY = 250;

// En package.json se cambia "proxy" por la dirección y puerto donde esté corriendo la API
const getGames = async () => {
    try {
        const response = await fetch('games');
        return await response.json();
    } catch (error) {
        if (error.response) {
            return { status: error.response.status };
        } else {
            return { status: TIMEOUT };
        }
    }
};

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
        const endpoint = "/universities?filter="+inputText
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

const getProgram = (programId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const program = SgaConstants.programs[9].find((p) => p.id == programId);
        setTimeout(() => resolve(program), RESOLVE_DELAY);
    });

const getBuilding = (buildingId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const building = SgaConstants.buildings[9].find((b) => b.id == buildingId);
        setTimeout(() => resolve(building), RESOLVE_DELAY);
    });

const getCourseClass = (classId) =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line
        const courseClass = Object.values(SgaConstants.courseClasses).flat().filter((com) => com.id == classId);
        if(!courseClass)
            return { status: NOT_FOUND }
        setTimeout(() => resolve(courseClass[0]), RESOLVE_DELAY);
    });

const getRequiredCourses = (courseId) =>
    new Promise((resolve, reject) => {
        const courses = {
            1: [SgaConstants.informaticaCourses[0], SgaConstants.informaticaCourses[5]]
        }
        setTimeout(() => resolve(courses), RESOLVE_DELAY);
    });

const getMandatoryCourses = (programId) =>
    new Promise((resolve, reject) => {
        const courses = [SgaConstants.informaticaCourses[0], SgaConstants.informaticaCourses[5]];
        setTimeout(() => resolve(courses), RESOLVE_DELAY);
    });

const getOptionalCourses = (programId) =>
    new Promise((resolve, reject) => {
        const courses = [SgaConstants.informaticaCourses[6]];
        setTimeout(() => resolve(courses), RESOLVE_DELAY);
    });

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
        const endpoint = "/university/" + universityId + "/programs?filter=" + inputText
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

const getBuildings = (universityId, page) =>
    new Promise((resolve, reject) => {
        const buildings = SgaConstants.buildings[9];
        if(!page)
            setTimeout(() => resolve(buildings), RESOLVE_DELAY);
        else{
            if(page==1)
                setTimeout(() => resolve([buildings[0], buildings[1]]), RESOLVE_DELAY);
            else if(page==2)
                setTimeout(() => resolve([buildings[2], buildings[3]]), RESOLVE_DELAY);
            else
                setTimeout(() => resolve([]), RESOLVE_DELAY);
        }
    });

const getRemainingCoursesProgram = (user, programId, inputText) =>
    new Promise((resolve, reject) => {
        const courses = SgaConstants.remainingCourses[programId-1]
        if(!inputText)
            setTimeout(() => resolve(courses), RESOLVE_DELAY);
        else{
            const resp = courses.filter((c) => c.name.toLowerCase().indexOf(inputText.toLowerCase()) !== -1)
            setTimeout(() => resolve(resp), RESOLVE_DELAY)
        }
    });

const getFinishedCourses = (studentId, page) =>
    new Promise((resolve, reject) => {
        const courseCodes = SgaConstants.finishedCourses.find((c) => c.student == studentId).courses;
        const courses = SgaConstants.informaticaCourses.filter((c) => {
            if (courseCodes.includes(c.id))
                return true;
            return false;
        });
        if(!page)
            setTimeout(() => resolve(courses), RESOLVE_DELAY);
        else{
            if(page==1)
                setTimeout(() => resolve(courses.slice(0, 5)), RESOLVE_DELAY);
            else if(page==2)
                setTimeout(() => resolve(courses.slice(5, 10)), RESOLVE_DELAY);
            else
                setTimeout(() => resolve([]), RESOLVE_DELAY);
        }
    });
/*{
    try {
        const endpoint = "student/"+student.id;
        const response = await api.get(endpoint, { headers: { 'Content-Type': 'application/json' , authorization: "Bearer "+AuthService.getToken()}});
        return response;
    } catch(err) {
        if(err.response)
            return { status : err.response.status };
        else
            return { status : TIMEOUT }
    }
}
    */


const addFinishedCourse = (studentId, courseId) =>
    new Promise((resolve, reject) => {
        const courseCodes = SgaConstants.finishedCourses.find((c) => c.student == studentId).courses;
        courseCodes.unshift(courseId);
        setTimeout(() => resolve(courseCodes), RESOLVE_DELAY);
    });

const deleteFinishedCourse = (studentId, courseId) =>
    new Promise((resolve, reject) => {
        const courseCodes = SgaConstants.finishedCourses.find((c) => c.student == studentId).courses;
        courseCodes.splice(courseCodes.indexOf(courseId), 1);
        setTimeout(() => resolve(courseCodes), RESOLVE_DELAY);
    });

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

const saveProgram = async (id, name, internalId, mandatoryCourses, optionalCourses) => {
    try {
        const payload = {
            'id': id,
            'name': name,
            'internalId': internalId,
            "mandatoryCourses": mandatoryCourses,
            "optionalCourses": optionalCourses,
        }
        if(id){
            return { status: OK };
        }
        else{
            return createProgram(payload)
        }
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

const saveBuilding = async (id, name, internalId, distances) => {
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
    registerStudent: registerStudent,
    registerUniversity: registerUniversity,
    login: login,
    logout: logout,
    requestPasswordChangeToken: requestPasswordChangeToken,
    getActiveUser: getActiveUser,
    getSchedules: getSchedules,
    getUniversities: getUniversities,
    getPrograms: getPrograms,
    getProgramsPage: getProgramsPage,
    getTerms: getTerms,
    getBuildings: getBuildings,
    getRemainingCoursesProgram: getRemainingCoursesProgram,
    getFinishedCourses: getFinishedCourses,
    getCourse: getCourse,
    getTerm: getTerm,
    getProgram: getProgram,
    getBuilding: getBuilding,
    getRequiredCourses: getRequiredCourses,
    getMandatoryCourses: getMandatoryCourses,
    getOptionalCourses: getOptionalCourses,
    getCourseClassesForTerm: getCourseClassesForTerm,
    addFinishedCourse: addFinishedCourse,
    deleteFinishedCourse: deleteFinishedCourse,
    deleteProgram: deleteProgram,
    getCourses: getCourses,
    getCoursesPage: getCoursesPage,
    getCourseClass: getCourseClass,
    deleteCourse: deleteCourse,
    deleteBuilding: deleteBuilding,
    deleteTerm: deleteTerm,
    deleteCourseClass: deleteCourseClass,
    publishTerm: publishTerm,
    unpublishTerm: unpublishTerm,
    saveCourseClass: saveCourseClass,
    saveTerm: saveTerm,
    saveCourse: saveCourse,
    saveProgram: saveProgram,
    saveBuilding: saveBuilding,
    getToken: getToken,
    changePassword: changePassword
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
