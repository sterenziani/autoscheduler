import {DAYS} from "../services/SystemConstants"

var informaticaCourses = [
    {
        id: '31.08',
        internalId: '31.08',
        name: 'Sistemas de Representación',
        requirements: {1:[]}
    },
    {
        id: '72.03',
        internalId: '72.03',
        name: 'Introducción a la Informática',
        requirements: {1:[]}
    },
    {
        id: '94.24',
        internalId: '94.24',
        name: 'Metodología del Aprendizaje',
        requirements: {1:[]}
    },
    {
        id: '93.26',
        internalId: '93.26',
        name: 'Análisis Matemático I',
        requirements: {1:[]}
    },
    {
        id: '93.58',
        internalId: '93.58',
        name: 'Algebra',
        requirements: {1:[]}
    },
    {
        id: '12.09',
        internalId: '12.09',
        name: 'Química',
        requirements: {1:[]}
    },
    {
        id: '72.31',
        internalId: '72.31',
        name: 'Programación Imperativa',
        requirements: {1:['93.58', '72.03']},
    },
    {
        id: '93.59',
        internalId: '93.59',
        name: 'Matemática Discreta',
        requirements: {1:['93.58']},
    },
    {
        id: '93.28',
        internalId: '93.28',
        name: 'Análisis Matemático II',
        requirements: {1:['93.58', '93.26']},
    },
    {
        id: '93.41',
        internalId: '93.41',
        name: 'Física I',
        requirements: {1:['93.26']},
    },
    {
        id: '72.32',
        internalId: '72.32',
        name: 'Diseño y Procesamiento de Documentos XML',
        requirements: {1:['72.31']},
    },
    {
        id: '72.33',
        internalId: '72.33',
        name: 'Programación Orientada a Objetos',
        requirements: {1:['72.31']},
    },
    {
        id: '93.35',
        internalId: '93.35',
        name: 'Lógica Computacional',
        requirements: {1:['93.58']},
    },
    {
        id: '93.42',
        internalId: '93.42',
        name: 'Física II',
        requirements: {1:['93.28']},
    },
    {
        id: '72.08',
        internalId: '72.08',
        name: 'Arquitectura de Computadoras',
        requirements: {1:['72.31']},
    },
    {
        id: '72.34',
        internalId: '72.34',
        name: 'Estructura de Datos y Algoritmos',
        requirements: {1:['93.59', '72.33']},
    },
    {
        id: '93.24',
        internalId: '93.24',
        name: 'Probabilidad y Estadística',
        requirements: {1:['93.28']},
    },
    {
        id: '93.43',
        internalId: '93.43',
        name: 'Física III',
        requirements: {1:['93.28', '93.41']},
    },
];

var programCourses = {
    1: informaticaCourses,
    2: [{ id: '93.99', internalId: '93.99', name: 'Algebra Lineal' }],
    3: [{ id: '93.99', internalId: '93.99', name: 'Algebra Lineal' }]
};

var courseClasses2022A = [
    {
        id: 1,
        course: {id: '12.09',internalId: '12.09',name: 'Química',requirements: {1:[]}},
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[5], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '72.03', internalId: '72.03', name: 'Introducción a la Informática', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '94.24', internalId: '94.24', name: 'Metodología del Aprendizaje', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'A',
        lectures: [{ day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '94.24', internalId: '94.24', name: 'Metodología del Aprendizaje', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'B',
        lectures: [{ day: DAYS[3], startTime: '11:00', endTime: '14:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '94.24', internalId: '94.24', name: 'Metodología del Aprendizaje', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[1], startTime: '14:00', endTime: '17:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '31.08', internalId: '31.08', name: 'Sistemas de Representación', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'A',
        lectures: [{ day: DAYS[2], startTime: '11:00', endTime: '14:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '31.08', internalId: '31.08', name: 'Sistemas de Representación', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'B',
        lectures: [{ day: DAYS[2], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '31.08', internalId: '31.08', name: 'Sistemas de Representación', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[3], startTime: '14:00', endTime: '17:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '31.08', internalId: '31.08', name: 'Sistemas de Representación', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'K',
        lectures: [{ day: DAYS[4], startTime: '14:00', endTime: '17:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '72.32', internalId: '72.32', name: 'Diseño y Procesamiento de Documentos XML', requirements: {1:['72.31']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[3], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '72.33', internalId: '72.33', name: 'Programación Orientada a Objetos', requirements: {1:['72.31']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[3], startTime: '14:00', endTime: '17:00', building: 'Madero' },
            { day: DAYS[4], startTime: '18:00', endTime: '21:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.26', internalId: '93.26', name: 'Análisis Matemático I', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[3], startTime: '08:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[5], startTime: '08:00', endTime: '11:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.58', internalId: '93.58', name: 'Algebra', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '09:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[4], startTime: '11:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[5], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '72.31', internalId: '72.31', name: 'Programación Imperativa', requirements: {1:['93.58', '72.03']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '18:00', endTime: '19:30', building: 'Madero' },
            { day: DAYS[3], startTime: '08:30', endTime: '10:00', building: 'Madero' },
            { day: DAYS[5], startTime: '09:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[5], startTime: '14:00', endTime: '18:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.28', internalId: '93.28', name: 'Análisis Matemático II', requirements: {1:['93.58', '93.26']} },
        term: '2022-1Q',
        courseClass: 'S1',
        lectures: [
            { day: DAYS[1], startTime: '12:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[2], startTime: '13:00', endTime: '15:00', building: 'Madero' },
            { day: DAYS[4], startTime: '12:00', endTime: '14:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.28', internalId: '93.28', name: 'Análisis Matemático II', requirements: {1:['93.58', '93.26']} },
        term: '2022-1Q',
        courseClass: 'S2',
        lectures: [
            { day: DAYS[1], startTime: '12:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[2], startTime: '13:00', endTime: '15:00', building: 'Madero' },
            { day: DAYS[4], startTime: '15:00', endTime: '17:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.41', internalId: '93.41', name: 'Física I', requirements: {1:['93.26']} },
        term: '2022-1Q',
        courseClass: 'A',
        lectures: [
            { day: DAYS[1], startTime: '14:00', endTime: '16:00', building: 'Madero' },
            { day: DAYS[2], startTime: '08:00', endTime: '10:00', building: 'Madero' },
            { day: DAYS[3], startTime: '10:00', endTime: '12:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.41', internalId: '93.41', name: 'Física I', requirements: {1:['93.26']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '16:00', endTime: '18:00', building: 'Madero' },
            { day: DAYS[2], startTime: '16:00', endTime: '18:00', building: 'Madero' },
            { day: DAYS[3], startTime: '16:00', endTime: '18:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.59', internalId: '93.59', name: 'Matemática Discreta', requirements: {1:['93.58']}},
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[2], startTime: '08:00', endTime: '11:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.35', internalId: '93.35', name: 'Lógica Computacional', requirements: {1:['93.58']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[2], startTime: '09:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[2], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.35', internalId: '93.35', name: 'Lógica Computacional', requirements: {1:['93.58']} },
        term: '2022-1Q',
        courseClass: 'S1',
        lectures: [
            { day: DAYS[1], startTime: '14:00', endTime: '16:00', building: 'Madero' },
            { day: DAYS[2], startTime: '09:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[2], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.42', internalId: '93.42', name: 'Física II', requirements: {1:['93.28']} },
        term: '2022-1Q',
        courseClass: 'A',
        lectures: [
            { day: DAYS[1], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[2], startTime: '08:00', endTime: '12:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.42', internalId: '93.42', name: 'Física II', requirements: {1:['93.28']} },
        term: '2022-1Q',
        courseClass: 'B',
        lectures: [
            { day: DAYS[3], startTime: '11:00', endTime: '15:00', building: 'Madero' },
            { day: DAYS[4], startTime: '08:00', endTime: '10:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.42', internalId: '93.42', name: 'Física II', requirements: {1:['93.28']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '12:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[4], startTime: '08:00', endTime: '12:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '72.08', internalId: '72.08', name: 'Arquitectura de Computadoras', requirements: {1:['72.31']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '16:00', endTime: '19:00', building: 'Madero' },
            { day: DAYS[3], startTime: '16:00', endTime: '19:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '72.34', internalId: '72.34', name: 'Estructura de Datos y Algoritmos', requirements: {1:['93.59', '72.33']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[3], startTime: '08:00', endTime: '11:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.24', internalId: '93.24', name: 'Probabilidad y Estadística', requirements: {1:['93.28']} },
        term: '2022-1Q',
        courseClass: 'SKE',
        lectures: [
            { day: DAYS[1], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[2], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[4], startTime: '11:00', endTime: '13:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.43', internalId: '93.43', name: 'Física III', requirements: {1:['93.28', '93.41']} },
        term: '2022-1Q',
        courseClass: 'A',
        lectures: [
            { day: DAYS[3], startTime: '09:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[4], startTime: '16:00', endTime: '18:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.43', internalId: '93.43', name: 'Física III', requirements: {1:['93.28', '93.41']} },
        term: '2022-1Q',
        courseClass: 'D',
        lectures: [
            { day: DAYS[3], startTime: '10:00', endTime: '12:00', building: 'Madero' },
            { day: DAYS[4], startTime: '17:00', endTime: '19:00', building: 'Madero' },
            { day: DAYS[5], startTime: '11:00', endTime: '13:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.43', internalId: '93.43', name: 'Física III', requirements: {1:['93.28', '93.41']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[4], startTime: '14:00', endTime: '18:00', building: 'Madero' },
            { day: DAYS[5], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
];

var courseClasses2021B = [
    {
        id: 1,
        course: { id: '12.09', internalId: '12.09', name: 'Química', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[5], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: {
            id: '72.03',
            internalId: '72.03',
            name: 'Introducción a la Informática',
            requirements: {1:[]}
        },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '94.24', internalId: '94.24', name: 'Metodología del Aprendizaje', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[1], startTime: '14:00', endTime: '17:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '31.08', internalId: '31.08', name: 'Sistemas de Representación', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[3], startTime: '14:00', endTime: '17:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '72.32', internalId: '72.32', name: 'Diseño y Procesamiento de Documentos XML', requirements: {1:['72.31']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [{ day: DAYS[3], startTime: '08:00', endTime: '11:00', building: 'Madero' }],
    },
    {
        id: 1,
        course: { id: '72.33', internalId: '72.33', name: 'Programación Orientada a Objetos', requirements: {1:['72.31']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[3], startTime: '14:00', endTime: '17:00', building: 'Madero' },
            { day: DAYS[4], startTime: '18:00', endTime: '21:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.26', internalId: '93.26', name: 'Análisis Matemático I', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[3], startTime: '08:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[5], startTime: '08:00', endTime: '11:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.58', internalId: '93.58', name: 'Algebra', requirements: {1:[]} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '09:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[4], startTime: '11:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[5], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '72.31', internalId: '72.31', name: 'Programación Imperativa', requirements: {1:['93.58', '72.03']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '18:00', endTime: '19:30', building: 'Madero' },
            { day: DAYS[3], startTime: '08:30', endTime: '10:00', building: 'Madero' },
            { day: DAYS[5], startTime: '09:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[5], startTime: '14:00', endTime: '18:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.28', internalId: '93.28', name: 'Análisis Matemático II', requirements: {1:['93.58', '93.26']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '12:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[3], startTime: '13:00', endTime: '15:00', building: 'Madero' },
            { day: DAYS[4], startTime: '12:00', endTime: '14:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.41', internalId: '93.41', name: 'Física I', requirements: {1:['93.26']} },
        term: '2022-1Q',
        courseClass: 'A',
        lectures: [
            { day: DAYS[1], startTime: '14:00', endTime: '16:00', building: 'Madero' },
            { day: DAYS[2], startTime: '08:00', endTime: '10:00', building: 'Madero' },
            { day: DAYS[3], startTime: '10:00', endTime: '12:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.59', internalId: '93.59', name: 'Matemática Discreta', requirements: {1:['93.58']}},
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[2], startTime: '08:00', endTime: '11:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: {
      id: '93.35', internalId: '93.35', name: 'Lógica Computacional', requirements: {1:['93.58']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[2], startTime: '09:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[2], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.42', internalId: '93.42', name: 'Física II', requirements: {1:['93.28']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[2], startTime: '12:00', endTime: '14:00', building: 'Madero' },
            { day: DAYS[4], startTime: '08:00', endTime: '12:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '72.08', internalId: '72.08', name: 'Arquitectura de Computadoras', requirements: {1:['72.31']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '16:00', endTime: '19:00', building: 'Madero' },
            { day: DAYS[3], startTime: '16:00', endTime: '19:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '72.34', internalId: '72.34', name: 'Estructura de Datos y Algoritmos', requirements: {1:['93.59', '72.33']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[1], startTime: '08:00', endTime: '11:00', building: 'Madero' },
            { day: DAYS[3], startTime: '08:00', endTime: '11:00', building: 'Madero' },
        ],
    },
    {
        id: 1,
        course: { id: '93.24', internalId: '93.24', name: 'Probabilidad y Estadística', requirements: {1:['93.28']} },
        term: '2022-1Q',
        courseClass: 'SKE',
        lectures: [
            { day: DAYS[1], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[2], startTime: '11:00', endTime: '13:00', building: 'Madero' },
            { day: DAYS[4], startTime: '11:00', endTime: '13:00', building: 'Madero' },
        ],
    },
    {
        id: 2,
        course: { id: '93.43', internalId: '93.43', name: 'Física III', requirements: {1:['93.28', '93.41']} },
        term: '2022-1Q',
        courseClass: 'S',
        lectures: [
            { day: DAYS[4], startTime: '14:00', endTime: '18:00', building: 'Madero' },
            { day: DAYS[5], startTime: '14:00', endTime: '16:00', building: 'Madero' },
        ],
    },
];

var courseClasses = { 6: courseClasses2021B, 5: courseClasses2022A, 7: [] };

var finishedCourses = [
    {
        student: 'Newcomer',
        courses: [],
    },
    {
        student: 'Algebra',
        courses: ['93.58', '72.03'],
    },
    {
        student: '1C',
        courses: ['93.58', '93.26', '72.03', '31.08', '94.24'],
    },
    {
        student: '2C',
        courses: ['93.58', '93.26', '72.03', '31.08', '94.24', '72.31', '93.59', '93.28', '93.41'],
    },
];

var remainingCourses = [informaticaCourses, [{ id: '93.99', internalId: '93.99', name: 'Algebra Lineal' }], []];

var terms = [
    { id: 6, internalId: '2021-2Q', name: '2° Cuatrimestre 2021', startDate: '2021-08-01', published: true },
    { id: 5, internalId: '2022-1Q', name: '1° Cuatrimestre 2022', startDate: '2022-03-01', published: true },
    { id: 7, internalId: '2022-2Q', name: '2° Cuatrimestre 2022', startDate: '2022-08-01', published: false },
];

var programs = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [
        { id: 2, internalId: 'I22', name: 'Ingeniería Industrial' },
        { id: 1, internalId: 'S10', name: 'Ingeniería Informática' },
        { id: 3, internalId: 'I13', name: 'Ingeniería Industrial' },
    ],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
];

var courses = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [...informaticaCourses, { id: '93.99', internalId: '93.99', name: 'Algebra Lineal', requirements: {'I22':[], 'I13':[]}}],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
];

var buildings = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [
        {
            id: 1,
            internalId: 'SDT',
            name: 'Sede Distrito Tecnológico',
            distances: [
                { building: { name: 'SDF', internalId: 'SDF'}, time: 30 },
                { building: { name: 'SR', internalId: 'SR' }, time: 10 },
                { building: { name: 'V', internalId: 'V' }, time: 10 },
            ],
        },
        {
            id: 2,
            internalId: 'SDF',
            name: 'Sede Distrito Financiero',
            distances: [
                { building: { name: 'SDF', internalId: 'SDF'}, time: 30 },
                { building: { name: 'SR', internalId: 'SR' }, time: 35 },
                { building: { name: 'V', internalId: 'V' }, time: 10 },
            ],
        },
        {
            id: 3,
            internalId: 'SR',
            name: 'Sede Rectorado',
            distances: [
                { building: { name: 'SDF', internalId: 'SDF'}, time: 10 },
                { building: { name: 'SR', internalId: 'SR' }, time: 35 },
                { building: { name: 'V', internalId: 'V' }, time: 10 },
            ],
        },
        {
            id: 4,
            internalId: 'V',
            name: 'Virtual',
            distances: [
                { building: { name: 'SDF', internalId: 'SDF'}, time: 30 },
                { building: { name: 'SR', internalId: 'SR' }, time: 10 },
                { building: { name: 'V', internalId: 'V' }, time: 10 },
            ],
        },
    ],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
];

const SgaConstants = {
    informaticaCourses: informaticaCourses,
    programCourses: programCourses,
    courseClasses2022A: courseClasses2022A,
    courseClasses: courseClasses,
    finishedCourses: finishedCourses,
    remainingCourses: remainingCourses,
    programs: programs,
    terms: terms,
    courses: courses,
    buildings: buildings,
};
export default SgaConstants;
