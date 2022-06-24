const DAYS = ['SUN', 'M', 'T', 'W', 'TH', 'F', 'SAT'];

var informaticaCourses = [
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

var courseClasses = [
  {
    course: '31.08',
    term: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[3], startTime:"14:00", endTime:"17:00", building:"Madero"}]
  },
  {
    course: '31.08',
    term: '2022-1Q',
    courseClass: 'K',
    lectures: [{day: DAYS[4], startTime:"14:00", endTime:"17:00", building:"Madero"}]
  },
  {
    course: '93.26',
    term: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[3], startTime:"08:00", endTime:"11:00", building:"Madero"},
                {day: DAYS[4], startTime:"08:00", endTime:"11:00", building:"Madero"}]
  },
  {
    course: '93.58',
    term: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[2], startTime:"09:00", endTime:"13:00", building:"Madero"},
                {day: DAYS[4], startTime:"11:00", endTime:"14:00", building:"Madero"},
                {day: DAYS[5], startTime:"14:00", endTime:"16:00", building:"Madero"}]
  },
  {
    course: '72.31',
    term: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[2], startTime:"18:00", endTime:"19:30", building:"Madero"},
                {day: DAYS[3], startTime:"08:30", endTime:"10:00", building:"Madero"},
                {day: DAYS[5], startTime:"09:00", endTime:"11:00", building:"Madero"},
                {day: DAYS[5], startTime:"14:00", endTime:"18:00", building:"Madero"}]
  },
  {
    course: '93.28',
    term: '2022-1Q',
    courseClass: 'S1',
    lectures: [{day: DAYS[1], startTime:"12:00", endTime:"14:00", building:"Madero"},
                {day: DAYS[2], startTime:"13:00", endTime:"15:00", building:"Madero"},
                {day: DAYS[4], startTime:"12:00", endTime:"14:00", building:"Madero"}]
  },
  {
    course: '93.28',
    term: '2022-1Q',
    courseClass: 'S2',
    lectures: [{day: DAYS[1], startTime:"12:00", endTime:"14:00", building:"Madero"},
                {day: DAYS[2], startTime:"13:00", endTime:"15:00", building:"Madero"},
                {day: DAYS[4], startTime:"15:00", endTime:"17:00", building:"Madero"}]
  },
  {
    course: '93.41',
    term: '2022-1Q',
    courseClass: 'A',
    lectures: [{day: DAYS[1], startTime:"14:00", endTime:"16:00", building:"Madero"},
                {day: DAYS[2], startTime:"08:00", endTime:"10:00", building:"Madero"},
                {day: DAYS[3], startTime:"10:00", endTime:"12:00", building:"Madero"}]
  },
  {
    course: '93.41',
    term: '2022-1Q',
    courseClass: 'S',
    lectures: [{day: DAYS[1], startTime:"16:00", endTime:"18:00", building:"Madero"},
                {day: DAYS[2], startTime:"16:00", endTime:"18:00", building:"Madero"},
                {day: DAYS[3], startTime:"16:00", endTime:"18:00", building:"Madero"}]
  }
]

var finishedCourses = [
  {
    student: 'Student',
    courses: ['93.58', '93.26']
  }
]

const SgaConstants = {
  informaticaCourses: informaticaCourses,
  courseClasses: courseClasses,
  finishedCourses: finishedCourses
};
export default SgaConstants;
