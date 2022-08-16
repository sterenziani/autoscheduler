import { CREATED, CONFLICT, TIMEOUT, UNAUTHORIZED, NOT_FOUND, OK } from './ApiConstants';
import SgaConstants from '../resources/SgaConstants';

/*
const getUsers = () =>
  new Promise((resolve, reject) => {
    if (!users) {
      return setTimeout(() => reject(new Error('Users not found')), 2); // wait for 250ms
    }
    setTimeout(() => resolve(Object.values(users)), 250);
  });

const getUser = (id) =>
  new Promise((resolve, reject) => {
    const user = users[id];

    if (!user) {
      return setTimeout(
        () => reject(new Error('User not found')),
        250
      );
    }
    setTimeout(() => resolve(users[id]), 250);
  });
  */

// En package.json se cambia "proxy" por la dirección y puerto donde esté corriendo la API
const getGames = async () => {
    try{
        const response = await fetch('games');
        return await response.json();
    }catch(error) {
      if(error.response) {
          return { status : error.response.status };
      } else {
          return { status : TIMEOUT }
      }
    }
}

const paramsToQuery = (params) => {
  let query = ""
  if(params){
      query += "?program="+params.program;
      query += "&term="+params.term;
      query += "&hours="+params.hours;
      query += "&reduceDays="+params.reduceDays;
      query += "&prioritizeUnlocks="+params.prioritizeUnlocks;
      if(params.unavailableTimeSlots){
        params.unavailableTimeSlots.forEach(slot => {
          query += "&unavailable="+slot;
        });
      }
  }
  return query
}

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

// TEMPORARY FIX FOR PROTOTYPE
const registerStudent = async(email, password, universityId, programId) => {
  try {
    const newUser = { "type":"student", "email": email, "password": password, "university": universityId, "program": programId}
    //const registerEndpoint = endpoint + '/register';
    //const response = await api.post(registerEndpoint, newUser, { headers: {contentType : "application/json"} });
    return { status : CREATED }//response.status }
  } catch(e) {
    if (e.response){
      if(e.response.status === CONFLICT)
        return { status: CONFLICT, conflicts: e.response.data}
      return { status : e.response.status }
    }
    else
      return { status : TIMEOUT }
  }
}

const registerUniversity = async(email, password, name) => {
  try {
    const newUser = { "type":"university", "email": email, "password": password, "name": name}
    //const registerEndpoint = endpoint + '/register';
    //const response = await api.post(registerEndpoint, newUser, { headers: {contentType : "application/json"} });
    return { status : CREATED }//response.status }
  } catch(e) {
    if (e.response){
      if(e.response.status === CONFLICT)
        return { status: CONFLICT, conflicts: e.response.data}
      return { status : e.response.status }
    }
    else
      return { status : TIMEOUT }
  }
}

const login = async (username, password) => {
  try {
    /*
    const response = await api.get(logInEndpoint, {headers : {authorization : 'Basic ' + btoa(username + ":" + password)}})
    if(response.status === UNAUTHORIZED)
      return { status: UNAUTHORIZED }
    token = response.headers.authorization;
    userStore.user = response.data;
    TokenStore.setToken(token);
    UserStore.setUser(userStore.user);
    */
    return { status: OK }
    } catch(e) {
      if (e.response)
        return { status: e.response.status }
      else
        return { status: TIMEOUT }
  }
}

const requestPasswordChangeToken = async (username, password) => {
  try {
    // Hacer algo
    return { status: CREATED }
    } catch(e) {
      if (e.response)
        return { status: e.response.status }
      else
        return { status: TIMEOUT }
  }
}

const getActiveUser = () =>
  new Promise((resolve, reject) => {
    const student = {
      "id": 1, "type":"student", "email": "student@itba.edu.ar",
      "name": "1C", "university": { "id":9, "name":"Instituto Tecnológico de Buenos Aires" },
      "program": { "id":1, "name":"S10 - Ingeniería Informática"}
    }
    const university = {
      "id": 9, "type":"university", "email": "rector@itba.edu.ar",
      "name": "Instituto Tecnológico de Buenos Aires", "verified": false
    }
    setTimeout(() => resolve(university), 250);
  });

const getSchedules = (params) =>
  new Promise((resolve, reject) => {
    let availableClasses = getAvailableClasses(params.userAsking); // Gets the classes the user is enabled to be in
    availableClasses = filterUnattendableClasses(availableClasses, params.unavailableTimeSlots); // Deletes classes that conflict with busy time
    calculateDurationOfEachClass(availableClasses); // Updates classes with time spent in each

    let schedules = getBestSchedules(availableClasses, params.hours, params.prioritizeUnlocks, params.reduceDays); // Returns sorted array
    setTimeout(() => resolve(schedules), 250);
  });

const getUniversities = () =>
  new Promise((resolve, reject) => {
    let programs =  [
                      { "id": 9, "name": "Instituto Tecnológico de Buenos Aires"},
                      { "id": 1, "name": "Academia para Astronautas"},
                      { "id": 2, "name": "Bachiller para Bochincheros"},
                      { "id": 3, "name": "Colegio Nacional de las Artes"},
                      { "id": 4, "name": "DaVinci"},
                      { "id": 5, "name": "Escuela Nacional de Estudiantes"},
                      { "id": 6, "name": "Facultad Nacional del Frisbee"},
                      { "id": 7, "name": "Universidad Gonzalo Gonzales"},
                      { "id": 8, "name": "Universidad Humberto Primo"},
                      { "id": 10, "name": "Instituto Julian Weich"},
                      { "id": 11, "name": "Universidad Kevingston"},
                      { "id": 12, "name": "Liceo Lisa Lissani"},
                      { "id": 13, "name": "Universidad de la Milanesa"},
                      { "id": 14, "name": "Universidad Nacional de Nicaragua"},
                      { "id": 15, "name": "Universidad Ortodoxa"},
                      { "id": 16, "name": "Politécnico de Buenos Aires"},
                      { "id": 17, "name": "Universidad Católica de Quebec"},
                      { "id": 18, "name": "Rectorado para Rectores"},
                      { "id": 19, "name": "Universidad Siglo 21"},
                      { "id": 20, "name": "UTN"},
                    ]
    setTimeout(() => resolve(programs), 250);
  });

const getPrograms = (universityId) =>
  new Promise((resolve, reject) => {
    let programs = SgaConstants.programs
    setTimeout(() => resolve(programs[universityId]), 250);
  });

const getCourses = (universityId) =>
  new Promise((resolve, reject) => {
    let courses = SgaConstants.courses
    setTimeout(() => resolve(courses[universityId]), 250);
  });

const getTerms = (universityId) =>
  new Promise((resolve, reject) => {
    let terms = SgaConstants.terms
    setTimeout(() => resolve(terms), 250);
  });

const getBuildings = (universityId) =>
  new Promise((resolve, reject) => {
    let buildings = SgaConstants.buildings
    setTimeout(() => resolve(buildings[universityId]), 250);
  });

const getRemainingCoursesProgram = (user, programId) =>
  new Promise((resolve, reject) => {
    let courses = SgaConstants.remainingCourses
    setTimeout(() => resolve(courses[programId-1]), 250);
  });

const getFinishedCourses = (student) =>
  new Promise((resolve, reject) => {
    let courseCodes = SgaConstants.finishedCourses.find(c => c.student === student).courses
    let courses = SgaConstants.informaticaCourses.filter(c => {
                                              if(courseCodes.includes(c.id))
                                                return true;
                                              return false;
                                            });
    setTimeout(() => resolve(courses), 250);
  });

const addFinishedCourse = (student, courseId) =>
  new Promise((resolve, reject) => {
    let courseCodes = SgaConstants.finishedCourses.find(c => c.student === student.name).courses
    courseCodes.push(courseId)
    setTimeout(() => resolve(courseCodes), 250);
  });

const deleteFinishedCourse = (student, courseId) =>
  new Promise((resolve, reject) => {
    let courseCodes = SgaConstants.finishedCourses.find(c => c.student === student.name).courses
    courseCodes.splice(courseCodes.indexOf(courseId), 1)
    setTimeout(() => resolve(courseCodes), 250);
  });

const deleteProgram = (program) =>
  new Promise((resolve, reject) => {
    let programs = SgaConstants.programs[9]
    programs.splice(programs.indexOf(program), 1)
    setTimeout(() => resolve(programs), 250);
  });

const deleteCourse = (course) =>
  new Promise((resolve, reject) => {
    let courses = SgaConstants.courses[9]
    courses.splice(courses.indexOf(course), 1)
    setTimeout(() => resolve(courses), 250);
  });

const deleteBuilding = (building) =>
  new Promise((resolve, reject) => {
    let buildings = SgaConstants.buildings[9]
    buildings.splice(buildings.indexOf(building), 1)
    setTimeout(() => resolve(buildings), 250);
  });

const deleteTerm = (term) =>
  new Promise((resolve, reject) => {
    let terms = SgaConstants.terms
    terms.splice(terms.indexOf(term), 1)
    setTimeout(() => resolve(terms), 250);
  });

const publishTerm = (term) => {
    let terms = SgaConstants.terms
    let found_term = terms[terms.indexOf(term)]
    if(found_term)
      found_term.published = true
    return { status: OK }
  }

const unpublishTerm = (term) => {
    let terms = SgaConstants.terms
    let found_term = terms[terms.indexOf(term)]
    if(found_term)
      found_term.published = false
    return { status: OK }
  }

const ApiService = {
  getGames    : getGames,
  registerStudent: registerStudent,
  registerUniversity: registerUniversity,
  login: login,
  requestPasswordChangeToken: requestPasswordChangeToken,
  getActiveUser: getActiveUser,
  getSchedules: getSchedules,
  getUniversities: getUniversities,
  getPrograms: getPrograms,
  getTerms: getTerms,
  getBuildings: getBuildings,
  getRemainingCoursesProgram: getRemainingCoursesProgram,
  getFinishedCourses: getFinishedCourses,
  addFinishedCourse: addFinishedCourse,
  deleteFinishedCourse: deleteFinishedCourse,
  deleteProgram: deleteProgram,
  getCourses: getCourses,
  deleteCourse: deleteCourse,
  deleteBuilding: deleteBuilding,
  deleteTerm: deleteTerm,
  publishTerm: publishTerm,
  unpublishTerm: unpublishTerm
};

export default ApiService;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////// ALGORITMO, ESTO SE MOVERÍA AL BACK //////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const getAvailableClasses = (student) => {
  const map = calculateImportanceOfEachCourse(SgaConstants.informaticaCourses)
  const passedCourses = SgaConstants.finishedCourses.find(c => c.student === student).courses;
  const availableCourses = SgaConstants.informaticaCourses.filter(c => {
                                            if(passedCourses.includes(c.id))
                                              return false;
                                            if(c.requirements)
                                              return c.requirements.every(req => passedCourses.includes(req))
                                            return true
                                          });
  let availableCourseCodes = []
  availableCourses.forEach(c => availableCourseCodes.push(c.id))
  const availableClasses = SgaConstants.courseClasses2022A.filter(com => availableCourseCodes.includes(com.course));
  availableClasses.forEach(c => {
    c.unlockables = (map[c.course])?map[c.course]:0 // Adds importance of that course to the class
    c.courseName = SgaConstants.informaticaCourses.find(s => s.id === c.course).name
  })
  return availableClasses;
}

const filterUnattendableClasses = (availableClasses, unavailableTimeSlots) => {
  let busySlots = []
  unavailableTimeSlots.forEach(t => {
    t = t.split("-")
    busySlots.push({day:t[0], startTime: t[1], endTime: t[2]})
  })
  return availableClasses.filter(com => areTimeSlotsCompatible(com.lectures, busySlots))
}

const areTimeSlotsCompatible = (slotsA, slotsB) => {
  for(let t of slotsA){
    for(let l of slotsB){
      if(l.day === t.day)
      {
        if(t.startTime <= l.startTime && l.startTime < t.endTime)
          return false
        if(l.startTime <= t.startTime && t.startTime < l.endTime)
          return false
      }
    }
  }
  return true
}

const calculateImportanceOfEachCourse = (programCourses) => {
  let map = {}
  programCourses.forEach(c => {
    if(c.requirements)
      c.requirements.forEach(r => {
        if(!map[r])
          map[r] = []
        map[r].push(c)
      })
  })
  let importanceMap = {}
  for(const key in map)
    importanceMap[key] = importanceRec(map, key)
  programCourses.forEach(c => {c.unlockables = (map[c.id])? map[c.id]:0})
  return importanceMap
}

const importanceRec = (map, c) => {
  if(!map[c])
    return 0
  let resp = map[c].length
  map[c].forEach(u => {
    resp += importanceRec(map, u)
  })
  return resp
}

const calculateDurationOfEachClass = (classes) => {
  classes.forEach(c => {
    c.weeklyHours = 0
    c.days = new Set()
    c.earliest = "23:59"
    c.latest = "00:00"
    c.lectures.forEach(l => {
      let startTime = l.startTime.split(/\D+/);
      let endTime = l.endTime.split(/\D+/);
      startTime = (startTime[0]*60 +startTime[1]*1)
      endTime = (endTime[0]*60 +endTime[1]*1)
      c.weeklyHours += (endTime-startTime)/60
      c.days.add(l.day)
      if(l.startTime < c.earliest)
        c.earliest = l.startTime
      if(l.endTime > c.latest)
        c.latest = l.endTime
    });
  })
}

const getBestSchedules = (availableClasses, desiredHours, prioritizeUnlocks, reduceDays) => {
  const courseCombinations = getCourseCombinations(availableClasses)
  let schedules = []
  courseCombinations.forEach(combo => {
    let lectureHours = 0
    let days = new Set()
    let unlockables = 0
    let earliest = '23:59'
    let latest = '00:00'
    combo.forEach(c =>{
      lectureHours += c.weeklyHours
      unlockables += c.unlockables
      days = new Set([...days, ...c.days])
      if(c.earliest < earliest)
        earliest = c.earliest
      if(c.latest > latest)
        latest = c.latest
    })

    let score = -Math.abs(desiredHours-lectureHours)
    if(reduceDays)
      score += (7-days.size)*3.5
    if(prioritizeUnlocks)
      score += unlockables
    schedules.push({courseClasses: combo, score: score, hours: lectureHours, days: days.size, earliest:earliest, latest:latest})
  })
  return schedules.sort((a, b) => {return b.score - a.score;}).slice(0, 10);
}

const getCourseCombinations = (arr = []) => {
  const combine = (sub, ind) => {
    let result = []
    let i, l, p;
    for (i = ind, l = arr.length; i < l; i++) {
      p = sub.slice(0);
      p.push(arr[i]);
      result = result.concat(combine(p, i + 1));
      if(isValidSchedule(p))
        result.push(p);
    };
    return result;
  }
  return combine([], 0);
};

const isValidSchedule = (courseClasses) => {
  for(let [i1,c1] of courseClasses.entries()){
    for(let [i2,c2] of courseClasses.entries()){
      // Same course, different class
      if(c1.course === c2.course && i1 !== i2)
        return false;
      // Lectures overlap
      if(c1 !== c2 && !areTimeSlotsCompatible(c1.lectures, c2.lectures))
        return false;
    };
  }
  return true;
}
