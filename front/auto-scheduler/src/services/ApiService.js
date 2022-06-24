import { TIMEOUT } from './ApiConstants';

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
      query += "&period="+params.period;
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

const getSchedules = (params) =>
  new Promise((resolve, reject) => {
    const query = paramsToQuery(params);
    var availableClasses = getAvailableClasses(params.userAsking);
    availableClasses = filterUnattendableClasses(availableClasses, params.unavailableTimeSlots);
    var schedules = getBestSchedules(availableClasses, params.hours, params.prioritizeUnlocks, params.reduceDays);
    setTimeout(() => resolve(schedules), 250);
  });

/*
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

const ApiService = {
  getGames    : getGames,
  getSchedules: getSchedules
};

export default ApiService;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////// ALGORITMO, ESTO SE MOVERÍA AL BACK //////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const DAYS = ['SUN', 'M', 'T', 'W', 'TH', 'F', 'SAT'];
let courses = [
  {
    id: '31.08',
    internalId: '31.08',
    name: 'Sistemas de Representación'
  },
  {
    id: '93.26',
    internalId: '93.26',
    name: 'Análisis Matemático I'
  },
  {
    id: '93.58',
    internalId: '93.58',
    name: 'Algebra'
  },
  {
    id: '72.31',
    internalId: '72.31',
    name: 'Programación Imperativa',
    requirements: ['93.58']
  },
  {
    id: '93.28',
    internalId: '93.28',
    name: 'Análisis Matemático II',
    requirements: ['93.58', '93.26']
  },
  {
    id: '93.41',
    internalId: '93.41',
    name: 'Física I',
    requirements: ['93.26']
  }
]

let courseClasses = [
  {
    course: '31.08',
    period: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[3], startTime:"14:00", endTime:"17:00", building:"Madero"}]
  },
  {
    course: '31.08',
    period: '2022-1Q',
    courseClass: 'K',
    lectures: [{day: DAYS[4], startTime:"14:00", endTime:"17:00", building:"Madero"}]
  },
  {
    course: '93.26',
    period: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[3], startTime:"08:00", endTime:"11:00", building:"Madero"},
                {day: DAYS[4], startTime:"08:00", endTime:"11:00", building:"Madero"}]
  },
  {
    course: '93.58',
    period: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[2], startTime:"09:00", endTime:"13:00", building:"Madero"},
                {day: DAYS[4], startTime:"11:00", endTime:"14:00", building:"Madero"},
                {day: DAYS[5], startTime:"14:00", endTime:"16:00", building:"Madero"}]
  },
  {
    course: '72.31',
    period: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[2], startTime:"18:00", endTime:"19:30", building:"Madero"},
                {day: DAYS[3], startTime:"08:30", endTime:"10:00", building:"Madero"},
                {day: DAYS[5], startTime:"09:00", endTime:"11:00", building:"Madero"},
                {day: DAYS[5], startTime:"14:00", endTime:"18:00", building:"Madero"}]
  },
  {
    course: '93.28',
    period: '2022-1Q',
    courseClass: 'S1',
    lectures: [{day: DAYS[1], startTime:"12:00", endTime:"14:00", building:"Madero"},
                {day: DAYS[2], startTime:"13:00", endTime:"15:00", building:"Madero"},
                {day: DAYS[4], startTime:"12:00", endTime:"14:00", building:"Madero"}]
  },
  {
    course: '93.28',
    period: '2022-1Q',
    courseClass: 'S2',
    lectures: [{day: DAYS[1], startTime:"12:00", endTime:"14:00", building:"Madero"},
                {day: DAYS[2], startTime:"13:00", endTime:"15:00", building:"Madero"},
                {day: DAYS[4], startTime:"15:00", endTime:"17:00", building:"Madero"}]
  },
  {
    course: '93.41',
    period: '2022-1Q',
    courseClass: 'A',
    lectures: [{day: DAYS[1], startTime:"14:00", endTime:"16:00", building:"Madero"},
                {day: DAYS[2], startTime:"08:00", endTime:"10:00", building:"Madero"},
                {day: DAYS[3], startTime:"10:00", endTime:"12:00", building:"Madero"}]
  },
  {
    course: '93.41',
    period: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[1], startTime:"16:00", endTime:"18:00", building:"Madero"},
                {day: DAYS[2], startTime:"16:00", endTime:"18:00", building:"Madero"},
                {day: DAYS[3], startTime:"16:00", endTime:"18:00", building:"Madero"}]
  }
]

let finishedCourses = [
  {
    student: 'Student',
    courses: ['93.58', '93.26']
  }
]

const getAvailableClasses = (student) => {
  const passedCourses = finishedCourses.find(c => c.student === student).courses;
  const availableCourses = courses.filter(c => {
                                            if(passedCourses.includes(c.id))
                                              return false;
                                            if(c.requirements)
                                              return c.requirements.every(req => passedCourses.includes(req))
                                            return true
                                          });
  let availableCourseCodes = []
  availableCourses.forEach(c => availableCourseCodes.push(c.id))
  const availableClasses = courseClasses.filter(com => availableCourseCodes.includes(com.course));
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
  for(var t of slotsA){
    for(var l of slotsB){
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

const getBestSchedules = (availableClasses, hours, unlocks, days) => {
  // TO DO: Implement Algorithm
  return availableClasses
}
