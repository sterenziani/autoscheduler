import { TIMEOUT } from './ApiConstants';
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
const getSchedules = (params) =>
  new Promise((resolve, reject) => {
    const query = paramsToQuery(params);
    let availableClasses = getAvailableClasses(params.userAsking); // Gets the classes the user is enabled to be in
    availableClasses = filterUnattendableClasses(availableClasses, params.unavailableTimeSlots); // Deletes classes that conflict with busy time
    calculateDurationOfEachClass(availableClasses); // Updates classes with time spent in each

    let schedules = getBestSchedules(availableClasses, params.hours, params.prioritizeUnlocks, params.reduceDays); // Returns sorted array
    setTimeout(() => resolve(schedules), 250);
  });

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
  const availableClasses = SgaConstants.courseClasses.filter(com => availableCourseCodes.includes(com.course));
  availableClasses.forEach(c => {
    c.unlockables = (map[c.course])?map[c.course]:0
    c.courseName = SgaConstants.informaticaCourses.find(s => s.id === c.course).name
  }) // Adds importance of that course to the class
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
          map[r] = 0
        map[r] += 1
      })
  })
  /*
  programCourses.forEach(c => {
    if(map[c.id])
      c.unlockables = map[c.id]
    else
      c.unlockables = 0
  })
  */
  return map
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
      days.add(c.days)
      if(c.earliest < earliest)
        earliest = c.earliest
      if(c.latest > latest)
        latest = c.latest
    })

    let score = -Math.abs(desiredHours-lectureHours)
    if(reduceDays)
      score += (7-days.size)*2
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
  for(let c1 of courseClasses){
    for(let c2 of courseClasses){
      // Same course, different class
      if(c1.course === c2.course && c1.courseClass != c2.courseClass)
        return false;
      // Lectures overlap
      if(c1 != c2 && !areTimeSlotsCompatible(c1.lectures, c2.lectures))
        return false;
    };
  }
  return true;
}