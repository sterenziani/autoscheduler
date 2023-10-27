import React from 'react';
import {OK} from '../resources/ApiConstants'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import { render, waitFor, queryByAttribute, fireEvent, act, screen } from '@testing-library/react';
import { when } from 'jest-when';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import selectEvent from 'react-select-event'
import { Link, BrowserRouter as Router } from 'react-router-dom';
import StudentCourseLog from '../components/Lists/StudentCourseLog';
import * as api from '../services/ApiService'

const page_size = 10
const university = {
    "id": "6520e48eb5aa5394ebd5b520",
    "name": "ITBA",
    "verified": true,
    "url": "/api/student/university",
    "coursesUrl": "/api/student/university/courses",
    "programsUrl": "/api/student/university/programs",
    "buildingsUrl": "/api/student/university/buildings",
    "termsUrl": "/api/student/university/terms",
    "studentsUrl": "/api/student/university/students",
    "courseClassesUrl": "/api/student/university/course-classes"
}
const programs = [
    {
        "id": "489fc504-0f46-4d09-bced-ad863cecab02",
        "internalId": "S10",
        "name": "Ingeniería Informática",
        "optionalCourseCredits": 27,
        "url": "/api/student/university/programs/489fc504-0f46-4d09-bced-ad863cecab02",
        "coursesUrl": "/api/student/university/programs/489fc504-0f46-4d09-bced-ad863cecab02/courses"
    },
    {
        "id": "9f23e5cc-744b-45de-be24-f810ea9d9a79",
        "internalId": "E11",
        "name": "Ingeniería Electricista",
        "optionalCourseCredits": 16,
        "url": "/api/student/university/programs/9f23e5cc-744b-45de-be24-f810ea9d9a79",
        "coursesUrl": "/api/student/university/programs/9f23e5cc-744b-45de-be24-f810ea9d9a79/courses"
    },
    {
        "id": "d1889c57-d31b-4928-9f7c-863b653d1e4b",
        "internalId": "K07",
        "name": "Ingeniería Electrónica",
        "optionalCourseCredits": 0,
        "url": "/api/student/university/programs/d1889c57-d31b-4928-9f7c-863b653d1e4b",
        "coursesUrl": "/api/student/university/programs/d1889c57-d31b-4928-9f7c-863b653d1e4b/courses"
    },
    {
        "id": "4198af1d-6a0e-4a5e-b275-8afdd0468555",
        "internalId": "P22",
        "name": "Ingeniería en Petróleo",
        "optionalCourseCredits": 0,
        "url": "/api/student/university/programs/4198af1d-6a0e-4a5e-b275-8afdd0468555",
        "coursesUrl": "/api/student/university/programs/4198af1d-6a0e-4a5e-b275-8afdd0468555/courses"
    },
    {
        "id": "684fa855-ef4c-46ff-ae85-e1d4c859ee9e",
        "internalId": "Q03",
        "name": "Ingeniería Química",
        "optionalCourseCredits": 0.5,
        "url": "/api/student/university/programs/684fa855-ef4c-46ff-ae85-e1d4c859ee9e",
        "coursesUrl": "/api/student/university/programs/684fa855-ef4c-46ff-ae85-e1d4c859ee9e/courses"
    }
]
const student = {email: "santiterenziani@gmail.com", id: "652384959a377ca413dc6fec", name: "Santiago Terenziani", role:"STUDENT", url: "/api/user", university, program: programs[0]}

const programMandatoryCourses = [
    {
        "id": "96d107a4-cd12-4fa8-85ec-89e70471b594",
        "internalId": "93.58",
        "name": "Algebra",
        "creditValue": 9,
        "url": "/api/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594",
        "courseClassesUrl": "/api/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594/course-classes",
        "requiredCoursesUrl": "/api/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594/required-courses",
        "requiredCreditsUrl": "/api/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "a151f9a6-de33-41c1-99dc-14cbdaf4a89a",
        "internalId": "93.26",
        "name": "Análisis Matemático I",
        "creditValue": 6,
        "url": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a",
        "courseClassesUrl": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/course-classes",
        "requiredCoursesUrl": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/required-courses",
        "requiredCreditsUrl": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3",
        "internalId": "93.28",
        "name": "Análisis Matemático II",
        "creditValue": 6,
        "url": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3",
        "courseClassesUrl": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3/course-classes",
        "requiredCoursesUrl": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3/required-courses",
        "requiredCreditsUrl": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "046a73af-1461-4b78-8168-c5d74fc87830",
        "internalId": "97.35",
        "name": "Arquitectura de Computadoras",
        "creditValue": 6,
        "url": "/api/university/courses/046a73af-1461-4b78-8168-c5d74fc87830",
        "courseClassesUrl": "/api/university/courses/046a73af-1461-4b78-8168-c5d74fc87830/course-classes",
        "requiredCoursesUrl": "/api/university/courses/046a73af-1461-4b78-8168-c5d74fc87830/required-courses",
        "requiredCreditsUrl": "/api/university/courses/046a73af-1461-4b78-8168-c5d74fc87830/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "84f6b4d2-3aa0-46f3-9268-2db66cd1a505",
        "internalId": "72.39",
        "name": "Autómatas, Teoría de Lenguajes y Compiladores",
        "creditValue": 6,
        "url": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505",
        "courseClassesUrl": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505/course-classes",
        "requiredCoursesUrl": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505/required-courses",
        "requiredCreditsUrl": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "505648af-64e4-40dd-a5d6-3ed5144b9304",
        "internalId": "72.37",
        "name": "Base de Datos I",
        "creditValue": 6,
        "url": "/api/university/courses/505648af-64e4-40dd-a5d6-3ed5144b9304",
        "courseClassesUrl": "/api/university/courses/505648af-64e4-40dd-a5d6-3ed5144b9304/course-classes",
        "requiredCoursesUrl": "/api/university/courses/505648af-64e4-40dd-a5d6-3ed5144b9304/required-courses",
        "requiredCreditsUrl": "/api/university/courses/505648af-64e4-40dd-a5d6-3ed5144b9304/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "81cb686f-8f75-41ee-b2a0-613921418ad4",
        "internalId": "72.41",
        "name": "Base de Datos II",
        "creditValue": 6,
        "url": "/api/university/courses/81cb686f-8f75-41ee-b2a0-613921418ad4",
        "courseClassesUrl": "/api/university/courses/81cb686f-8f75-41ee-b2a0-613921418ad4/course-classes",
        "requiredCoursesUrl": "/api/university/courses/81cb686f-8f75-41ee-b2a0-613921418ad4/required-courses",
        "requiredCreditsUrl": "/api/university/courses/81cb686f-8f75-41ee-b2a0-613921418ad4/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "30645c30-3ca5-4524-93e9-eb7ab440c1dd",
        "internalId": "72.44",
        "name": "Criptografía y Seguridad",
        "creditValue": 6,
        "url": "/api/university/courses/30645c30-3ca5-4524-93e9-eb7ab440c1dd",
        "courseClassesUrl": "/api/university/courses/30645c30-3ca5-4524-93e9-eb7ab440c1dd/course-classes",
        "requiredCoursesUrl": "/api/university/courses/30645c30-3ca5-4524-93e9-eb7ab440c1dd/required-courses",
        "requiredCreditsUrl": "/api/university/courses/30645c30-3ca5-4524-93e9-eb7ab440c1dd/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "9524cfbd-4fcf-42ae-aec3-961775a04b3c",
        "internalId": "61.32",
        "name": "Derecho para Ingenieros",
        "creditValue": 3,
        "url": "/api/university/courses/9524cfbd-4fcf-42ae-aec3-961775a04b3c",
        "courseClassesUrl": "/api/university/courses/9524cfbd-4fcf-42ae-aec3-961775a04b3c/course-classes",
        "requiredCoursesUrl": "/api/university/courses/9524cfbd-4fcf-42ae-aec3-961775a04b3c/required-courses",
        "requiredCreditsUrl": "/api/university/courses/9524cfbd-4fcf-42ae-aec3-961775a04b3c/required-credits",
        "requiredCredits": "144"
    },
    {
        "id": "c4c7f7cd-16b6-41a2-8f83-f79ba42748e9",
        "internalId": "61.23",
        "name": "Economía para Ingenieros",
        "creditValue": 3,
        "url": "/api/university/courses/c4c7f7cd-16b6-41a2-8f83-f79ba42748e9",
        "courseClassesUrl": "/api/university/courses/c4c7f7cd-16b6-41a2-8f83-f79ba42748e9/course-classes",
        "requiredCoursesUrl": "/api/university/courses/c4c7f7cd-16b6-41a2-8f83-f79ba42748e9/required-courses",
        "requiredCreditsUrl": "/api/university/courses/c4c7f7cd-16b6-41a2-8f83-f79ba42748e9/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "95f55234-26bc-4607-80c1-b398f1b74b01",
        "internalId": "82.31",
        "name": "Estructura de Datos y Algoritmos",
        "creditValue": 6,
        "url": "/api/university/courses/95f55234-26bc-4607-80c1-b398f1b74b01",
        "courseClassesUrl": "/api/university/courses/95f55234-26bc-4607-80c1-b398f1b74b01/course-classes",
        "requiredCoursesUrl": "/api/university/courses/95f55234-26bc-4607-80c1-b398f1b74b01/required-courses",
        "requiredCreditsUrl": "/api/university/courses/95f55234-26bc-4607-80c1-b398f1b74b01/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "923d519c-7f3c-4caf-8834-3c350e11d7ce",
        "internalId": "93.41",
        "name": "Física I",
        "creditValue": 6,
        "url": "/api/university/courses/923d519c-7f3c-4caf-8834-3c350e11d7ce",
        "courseClassesUrl": "/api/university/courses/923d519c-7f3c-4caf-8834-3c350e11d7ce/course-classes",
        "requiredCoursesUrl": "/api/university/courses/923d519c-7f3c-4caf-8834-3c350e11d7ce/required-courses",
        "requiredCreditsUrl": "/api/university/courses/923d519c-7f3c-4caf-8834-3c350e11d7ce/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "5c5e0fe4-e388-44f1-92bb-72d54e7c8e3c",
        "internalId": "93.42",
        "name": "Física II",
        "creditValue": 6,
        "url": "/api/university/courses/5c5e0fe4-e388-44f1-92bb-72d54e7c8e3c",
        "courseClassesUrl": "/api/university/courses/5c5e0fe4-e388-44f1-92bb-72d54e7c8e3c/course-classes",
        "requiredCoursesUrl": "/api/university/courses/5c5e0fe4-e388-44f1-92bb-72d54e7c8e3c/required-courses",
        "requiredCreditsUrl": "/api/university/courses/5c5e0fe4-e388-44f1-92bb-72d54e7c8e3c/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "0a5c8e52-e4f1-4e1d-9923-bbfeeb662b1f",
        "internalId": "93.43",
        "name": "Física III",
        "creditValue": 6,
        "url": "/api/university/courses/0a5c8e52-e4f1-4e1d-9923-bbfeeb662b1f",
        "courseClassesUrl": "/api/university/courses/0a5c8e52-e4f1-4e1d-9923-bbfeeb662b1f/course-classes",
        "requiredCoursesUrl": "/api/university/courses/0a5c8e52-e4f1-4e1d-9923-bbfeeb662b1f/required-courses",
        "requiredCreditsUrl": "/api/university/courses/0a5c8e52-e4f1-4e1d-9923-bbfeeb662b1f/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "e3b91230-06de-41e8-8555-f4247fcd0693",
        "internalId": "94.21",
        "name": "Formación General I",
        "creditValue": 3,
        "url": "/api/university/courses/e3b91230-06de-41e8-8555-f4247fcd0693",
        "courseClassesUrl": "/api/university/courses/e3b91230-06de-41e8-8555-f4247fcd0693/course-classes",
        "requiredCoursesUrl": "/api/university/courses/e3b91230-06de-41e8-8555-f4247fcd0693/required-courses",
        "requiredCreditsUrl": "/api/university/courses/e3b91230-06de-41e8-8555-f4247fcd0693/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "bee25ec1-b009-4a47-bb67-62ea0f86775f",
        "internalId": "94.23",
        "name": "Formación General III",
        "creditValue": 3,
        "url": "/api/university/courses/bee25ec1-b009-4a47-bb67-62ea0f86775f",
        "courseClassesUrl": "/api/university/courses/bee25ec1-b009-4a47-bb67-62ea0f86775f/course-classes",
        "requiredCoursesUrl": "/api/university/courses/bee25ec1-b009-4a47-bb67-62ea0f86775f/required-courses",
        "requiredCreditsUrl": "/api/university/courses/bee25ec1-b009-4a47-bb67-62ea0f86775f/required-credits",
        "requiredCredits": "168"
    },
    {
        "id": "7f8b7df3-a092-4922-996f-36ba918d32b1",
        "internalId": "72.43",
        "name": "Gestión de Proyectos Informáticos",
        "creditValue": 3,
        "url": "/api/university/courses/7f8b7df3-a092-4922-996f-36ba918d32b1",
        "courseClassesUrl": "/api/university/courses/7f8b7df3-a092-4922-996f-36ba918d32b1/course-classes",
        "requiredCoursesUrl": "/api/university/courses/7f8b7df3-a092-4922-996f-36ba918d32b1/required-courses",
        "requiredCreditsUrl": "/api/university/courses/7f8b7df3-a092-4922-996f-36ba918d32b1/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "c27c993e-5f16-4b2d-aca5-a888905ff1be",
        "internalId": "72.35",
        "name": "Ingeniería de Software I",
        "creditValue": 6,
        "url": "/api/university/courses/c27c993e-5f16-4b2d-aca5-a888905ff1be",
        "courseClassesUrl": "/api/university/courses/c27c993e-5f16-4b2d-aca5-a888905ff1be/course-classes",
        "requiredCoursesUrl": "/api/university/courses/c27c993e-5f16-4b2d-aca5-a888905ff1be/required-courses",
        "requiredCreditsUrl": "/api/university/courses/c27c993e-5f16-4b2d-aca5-a888905ff1be/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "e8eabf5f-962c-4bcb-995b-1981194d6f2a",
        "internalId": "72.40",
        "name": "Ingeniería de Software II",
        "creditValue": 3,
        "url": "/api/university/courses/e8eabf5f-962c-4bcb-995b-1981194d6f2a",
        "courseClassesUrl": "/api/university/courses/e8eabf5f-962c-4bcb-995b-1981194d6f2a/course-classes",
        "requiredCoursesUrl": "/api/university/courses/e8eabf5f-962c-4bcb-995b-1981194d6f2a/required-courses",
        "requiredCreditsUrl": "/api/university/courses/e8eabf5f-962c-4bcb-995b-1981194d6f2a/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "ac7822a0-e6ad-4dcb-866d-ef091eaf5ac3",
        "internalId": "72.36",
        "name": "Interacción Hombre-Computadora (HCI)",
        "creditValue": 6,
        "url": "/api/university/courses/ac7822a0-e6ad-4dcb-866d-ef091eaf5ac3",
        "courseClassesUrl": "/api/university/courses/ac7822a0-e6ad-4dcb-866d-ef091eaf5ac3/course-classes",
        "requiredCoursesUrl": "/api/university/courses/ac7822a0-e6ad-4dcb-866d-ef091eaf5ac3/required-courses",
        "requiredCreditsUrl": "/api/university/courses/ac7822a0-e6ad-4dcb-866d-ef091eaf5ac3/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "3edab61e-1708-4193-aaf6-64e3681cad2a",
        "internalId": "72.03",
        "name": "Intro a la Informática",
        "creditValue": 3,
        "url": "/api/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a",
        "courseClassesUrl": "/api/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a/course-classes",
        "requiredCoursesUrl": "/api/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a/required-courses",
        "requiredCreditsUrl": "/api/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "4131342a-dbd5-4166-b9a8-6d66812ea3d0",
        "internalId": "93.35",
        "name": "Lógica Computacional",
        "creditValue": 6,
        "url": "/api/university/courses/4131342a-dbd5-4166-b9a8-6d66812ea3d0",
        "courseClassesUrl": "/api/university/courses/4131342a-dbd5-4166-b9a8-6d66812ea3d0/course-classes",
        "requiredCoursesUrl": "/api/university/courses/4131342a-dbd5-4166-b9a8-6d66812ea3d0/required-courses",
        "requiredCreditsUrl": "/api/university/courses/4131342a-dbd5-4166-b9a8-6d66812ea3d0/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "8168a530-2c9e-4f79-9402-5e774b1a7d01",
        "internalId": "93.59",
        "name": "Matemática Discreta",
        "creditValue": 6,
        "url": "/api/university/courses/8168a530-2c9e-4f79-9402-5e774b1a7d01",
        "courseClassesUrl": "/api/university/courses/8168a530-2c9e-4f79-9402-5e774b1a7d01/course-classes",
        "requiredCoursesUrl": "/api/university/courses/8168a530-2c9e-4f79-9402-5e774b1a7d01/required-courses",
        "requiredCreditsUrl": "/api/university/courses/8168a530-2c9e-4f79-9402-5e774b1a7d01/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "7516ec8d-a981-489c-97a3-5b1bdd719a15",
        "internalId": "94.24",
        "name": "Metodología del Aprendizaje",
        "creditValue": 3,
        "url": "/api/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15",
        "courseClassesUrl": "/api/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15/course-classes",
        "requiredCoursesUrl": "/api/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15/required-courses",
        "requiredCreditsUrl": "/api/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "8c4f042e-5724-4aa2-b156-bf49a8a5b710",
        "internalId": "93.07",
        "name": "Métodos Numéricos",
        "creditValue": 3,
        "url": "/api/university/courses/8c4f042e-5724-4aa2-b156-bf49a8a5b710",
        "courseClassesUrl": "/api/university/courses/8c4f042e-5724-4aa2-b156-bf49a8a5b710/course-classes",
        "requiredCoursesUrl": "/api/university/courses/8c4f042e-5724-4aa2-b156-bf49a8a5b710/required-courses",
        "requiredCreditsUrl": "/api/university/courses/8c4f042e-5724-4aa2-b156-bf49a8a5b710/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "0c03b382-fbaa-4f01-ade8-86973f3a3602",
        "internalId": "93.75",
        "name": "Métodos Numéricos Avanzados",
        "creditValue": 6,
        "url": "/api/university/courses/0c03b382-fbaa-4f01-ade8-86973f3a3602",
        "courseClassesUrl": "/api/university/courses/0c03b382-fbaa-4f01-ade8-86973f3a3602/course-classes",
        "requiredCoursesUrl": "/api/university/courses/0c03b382-fbaa-4f01-ade8-86973f3a3602/required-courses",
        "requiredCreditsUrl": "/api/university/courses/0c03b382-fbaa-4f01-ade8-86973f3a3602/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "e5a309e2-77a7-43b2-9c95-ab109acefd5e",
        "internalId": "93.24",
        "name": "Probabilidad y Estadística",
        "creditValue": 6,
        "url": "/api/university/courses/e5a309e2-77a7-43b2-9c95-ab109acefd5e",
        "courseClassesUrl": "/api/university/courses/e5a309e2-77a7-43b2-9c95-ab109acefd5e/course-classes",
        "requiredCoursesUrl": "/api/university/courses/e5a309e2-77a7-43b2-9c95-ab109acefd5e/required-courses",
        "requiredCreditsUrl": "/api/university/courses/e5a309e2-77a7-43b2-9c95-ab109acefd5e/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "17a1bccf-ac61-4e2b-ac20-932304b81fda",
        "internalId": "72.32",
        "name": "Procesamiento de Documentos XML",
        "creditValue": 3,
        "url": "/api/university/courses/17a1bccf-ac61-4e2b-ac20-932304b81fda",
        "courseClassesUrl": "/api/university/courses/17a1bccf-ac61-4e2b-ac20-932304b81fda/course-classes",
        "requiredCoursesUrl": "/api/university/courses/17a1bccf-ac61-4e2b-ac20-932304b81fda/required-courses",
        "requiredCreditsUrl": "/api/university/courses/17a1bccf-ac61-4e2b-ac20-932304b81fda/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "c9c67414-b6b4-4ec7-8bee-1cccf51520a4",
        "internalId": "72.42",
        "name": "Programación de Objetos Distribuidos",
        "creditValue": 3,
        "url": "/api/university/courses/c9c67414-b6b4-4ec7-8bee-1cccf51520a4",
        "courseClassesUrl": "/api/university/courses/c9c67414-b6b4-4ec7-8bee-1cccf51520a4/course-classes",
        "requiredCoursesUrl": "/api/university/courses/c9c67414-b6b4-4ec7-8bee-1cccf51520a4/required-courses",
        "requiredCreditsUrl": "/api/university/courses/c9c67414-b6b4-4ec7-8bee-1cccf51520a4/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "a53b0296-775e-482f-8130-a15ed6045a6e",
        "internalId": "72.31",
        "name": "Programación Imperativa",
        "creditValue": 9,
        "url": "/api/university/courses/a53b0296-775e-482f-8130-a15ed6045a6e",
        "courseClassesUrl": "/api/university/courses/a53b0296-775e-482f-8130-a15ed6045a6e/course-classes",
        "requiredCoursesUrl": "/api/university/courses/a53b0296-775e-482f-8130-a15ed6045a6e/required-courses",
        "requiredCreditsUrl": "/api/university/courses/a53b0296-775e-482f-8130-a15ed6045a6e/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "b1aa5598-018b-422e-8253-941c55932ff5",
        "internalId": "72.33",
        "name": "Programación Orientada a Objetos",
        "creditValue": 6,
        "url": "/api/university/courses/b1aa5598-018b-422e-8253-941c55932ff5",
        "courseClassesUrl": "/api/university/courses/b1aa5598-018b-422e-8253-941c55932ff5/course-classes",
        "requiredCoursesUrl": "/api/university/courses/b1aa5598-018b-422e-8253-941c55932ff5/required-courses",
        "requiredCreditsUrl": "/api/university/courses/b1aa5598-018b-422e-8253-941c55932ff5/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "03d35f0e-ad74-4b41-ad0e-3edd2f40cc88",
        "internalId": "72.07",
        "name": "Protocolos de Comunicación",
        "creditValue": 6,
        "url": "/api/university/courses/03d35f0e-ad74-4b41-ad0e-3edd2f40cc88",
        "courseClassesUrl": "/api/university/courses/03d35f0e-ad74-4b41-ad0e-3edd2f40cc88/course-classes",
        "requiredCoursesUrl": "/api/university/courses/03d35f0e-ad74-4b41-ad0e-3edd2f40cc88/required-courses",
        "requiredCreditsUrl": "/api/university/courses/03d35f0e-ad74-4b41-ad0e-3edd2f40cc88/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "f8b45209-0579-4556-a103-6c171ce4cb7d",
        "internalId": "72.38",
        "name": "Proyecto de Aplicaciones Web",
        "creditValue": 6,
        "url": "/api/university/courses/f8b45209-0579-4556-a103-6c171ce4cb7d",
        "courseClassesUrl": "/api/university/courses/f8b45209-0579-4556-a103-6c171ce4cb7d/course-classes",
        "requiredCoursesUrl": "/api/university/courses/f8b45209-0579-4556-a103-6c171ce4cb7d/required-courses",
        "requiredCreditsUrl": "/api/university/courses/f8b45209-0579-4556-a103-6c171ce4cb7d/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "14a6b769-92e0-474b-97c7-227b1267a698",
        "internalId": "72.45",
        "name": "Proyecto Final",
        "creditValue": 12,
        "url": "/api/university/courses/14a6b769-92e0-474b-97c7-227b1267a698",
        "courseClassesUrl": "/api/university/courses/14a6b769-92e0-474b-97c7-227b1267a698/course-classes",
        "requiredCoursesUrl": "/api/university/courses/14a6b769-92e0-474b-97c7-227b1267a698/required-courses",
        "requiredCreditsUrl": "/api/university/courses/14a6b769-92e0-474b-97c7-227b1267a698/required-credits",
        "requiredCredits": "160"
    },
    {
        "id": "84c7dc7e-5d6c-428d-b7fd-f57a08c0fc0b",
        "internalId": "12.09",
        "name": "Química",
        "creditValue": 3,
        "url": "/api/university/courses/84c7dc7e-5d6c-428d-b7fd-f57a08c0fc0b",
        "courseClassesUrl": "/api/university/courses/84c7dc7e-5d6c-428d-b7fd-f57a08c0fc0b/course-classes",
        "requiredCoursesUrl": "/api/university/courses/84c7dc7e-5d6c-428d-b7fd-f57a08c0fc0b/required-courses",
        "requiredCreditsUrl": "/api/university/courses/84c7dc7e-5d6c-428d-b7fd-f57a08c0fc0b/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "a3c185af-f06c-423f-b4db-9ef4c3a7e637",
        "internalId": "72.20",
        "name": "Redes de Información",
        "creditValue": 6,
        "url": "/api/university/courses/a3c185af-f06c-423f-b4db-9ef4c3a7e637",
        "courseClassesUrl": "/api/university/courses/a3c185af-f06c-423f-b4db-9ef4c3a7e637/course-classes",
        "requiredCoursesUrl": "/api/university/courses/a3c185af-f06c-423f-b4db-9ef4c3a7e637/required-courses",
        "requiredCreditsUrl": "/api/university/courses/a3c185af-f06c-423f-b4db-9ef4c3a7e637/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "53d3f32b-8fd1-4204-b7df-d7e0d7fec54a",
        "internalId": "12.83",
        "name": "Seguridad Ocupacional y Ambiental",
        "creditValue": 3,
        "url": "/api/university/courses/53d3f32b-8fd1-4204-b7df-d7e0d7fec54a",
        "courseClassesUrl": "/api/university/courses/53d3f32b-8fd1-4204-b7df-d7e0d7fec54a/course-classes",
        "requiredCoursesUrl": "/api/university/courses/53d3f32b-8fd1-4204-b7df-d7e0d7fec54a/required-courses",
        "requiredCreditsUrl": "/api/university/courses/53d3f32b-8fd1-4204-b7df-d7e0d7fec54a/required-credits",
        "requiredCredits": "140"
    },
    {
        "id": "a76715f8-feb4-4d06-b0f6-711be23ae8d3",
        "internalId": "72.25",
        "name": "Simulación de Sistemas",
        "creditValue": 6,
        "url": "/api/university/courses/a76715f8-feb4-4d06-b0f6-711be23ae8d3",
        "courseClassesUrl": "/api/university/courses/a76715f8-feb4-4d06-b0f6-711be23ae8d3/course-classes",
        "requiredCoursesUrl": "/api/university/courses/a76715f8-feb4-4d06-b0f6-711be23ae8d3/required-courses",
        "requiredCreditsUrl": "/api/university/courses/a76715f8-feb4-4d06-b0f6-711be23ae8d3/required-credits",
        "requiredCredits": "140"
    },
    {
        "id": "8de828ce-2548-45a7-97fc-f3ba05c5f483",
        "internalId": "72.27",
        "name": "Sistemas de Inteligencia Artificial",
        "creditValue": 6,
        "url": "/api/university/courses/8de828ce-2548-45a7-97fc-f3ba05c5f483",
        "courseClassesUrl": "/api/university/courses/8de828ce-2548-45a7-97fc-f3ba05c5f483/course-classes",
        "requiredCoursesUrl": "/api/university/courses/8de828ce-2548-45a7-97fc-f3ba05c5f483/required-courses",
        "requiredCreditsUrl": "/api/university/courses/8de828ce-2548-45a7-97fc-f3ba05c5f483/required-credits",
        "requiredCredits": "140"
    },
    {
        "id": "96350fb1-e84d-4be9-8162-dffda44cc612",
        "internalId": "31.08",
        "name": "Sistemas de Representación",
        "creditValue": 3,
        "url": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612",
        "courseClassesUrl": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612/course-classes",
        "requiredCoursesUrl": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612/required-courses",
        "requiredCreditsUrl": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "a957f07c-8ed0-4106-bc4c-d8fa170e4050",
        "internalId": "72.11",
        "name": "Sistemas Operativos",
        "creditValue": 6,
        "url": "/api/university/courses/a957f07c-8ed0-4106-bc4c-d8fa170e4050",
        "courseClassesUrl": "/api/university/courses/a957f07c-8ed0-4106-bc4c-d8fa170e4050/course-classes",
        "requiredCoursesUrl": "/api/university/courses/a957f07c-8ed0-4106-bc4c-d8fa170e4050/required-courses",
        "requiredCreditsUrl": "/api/university/courses/a957f07c-8ed0-4106-bc4c-d8fa170e4050/required-credits",
        "requiredCredits": "0"
    }
]
const programOptionalCourses = [
    {
        "id": "9991e2d7-7c47-4fbb-a28b-0101afc8e957",
        "internalId": "82.08",
        "name": "Cloud Computing",
        "creditValue": 3,
        "url": "/api/university/courses/9991e2d7-7c47-4fbb-a28b-0101afc8e957",
        "courseClassesUrl": "/api/university/courses/9991e2d7-7c47-4fbb-a28b-0101afc8e957/course-classes",
        "requiredCoursesUrl": "/api/university/courses/9991e2d7-7c47-4fbb-a28b-0101afc8e957/required-courses",
        "requiredCreditsUrl": "/api/university/courses/9991e2d7-7c47-4fbb-a28b-0101afc8e957/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "695c52bd-2e5e-4a1a-bbd8-37904e83c379",
        "internalId": "72.97",
        "name": "Introducción a la Programación de Videojuegos",
        "creditValue": 3,
        "url": "/api/university/courses/695c52bd-2e5e-4a1a-bbd8-37904e83c379",
        "courseClassesUrl": "/api/university/courses/695c52bd-2e5e-4a1a-bbd8-37904e83c379/course-classes",
        "requiredCoursesUrl": "/api/university/courses/695c52bd-2e5e-4a1a-bbd8-37904e83c379/required-courses",
        "requiredCreditsUrl": "/api/university/courses/695c52bd-2e5e-4a1a-bbd8-37904e83c379/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "1fdec68d-9bcf-4c9c-ae8a-b4ad058e4974",
        "internalId": "72.75",
        "name": "Machine Learning",
        "creditValue": 3,
        "url": "/api/university/courses/1fdec68d-9bcf-4c9c-ae8a-b4ad058e4974",
        "courseClassesUrl": "/api/university/courses/1fdec68d-9bcf-4c9c-ae8a-b4ad058e4974/course-classes",
        "requiredCoursesUrl": "/api/university/courses/1fdec68d-9bcf-4c9c-ae8a-b4ad058e4974/required-courses",
        "requiredCreditsUrl": "/api/university/courses/1fdec68d-9bcf-4c9c-ae8a-b4ad058e4974/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "c065249b-b51c-4242-8be1-18166a516979",
        "internalId": "72.60",
        "name": "Programación Funcional",
        "creditValue": 3,
        "url": "/api/university/courses/c065249b-b51c-4242-8be1-18166a516979",
        "courseClassesUrl": "/api/university/courses/c065249b-b51c-4242-8be1-18166a516979/course-classes",
        "requiredCoursesUrl": "/api/university/courses/c065249b-b51c-4242-8be1-18166a516979/required-courses",
        "requiredCreditsUrl": "/api/university/courses/c065249b-b51c-4242-8be1-18166a516979/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "4928e726-6cbc-4205-9b64-90ec7b00de97",
        "internalId": "23.15",
        "name": "Realidad Virtual",
        "creditValue": 3,
        "url": "/api/university/courses/4928e726-6cbc-4205-9b64-90ec7b00de97",
        "courseClassesUrl": "/api/university/courses/4928e726-6cbc-4205-9b64-90ec7b00de97/course-classes",
        "requiredCoursesUrl": "/api/university/courses/4928e726-6cbc-4205-9b64-90ec7b00de97/required-courses",
        "requiredCreditsUrl": "/api/university/courses/4928e726-6cbc-4205-9b64-90ec7b00de97/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "baaf9127-7703-48b0-8beb-c2b47ccb1bab",
        "internalId": "72.74",
        "name": "Visualización de la Información",
        "creditValue": 3,
        "url": "/api/university/courses/baaf9127-7703-48b0-8beb-c2b47ccb1bab",
        "courseClassesUrl": "/api/university/courses/baaf9127-7703-48b0-8beb-c2b47ccb1bab/course-classes",
        "requiredCoursesUrl": "/api/university/courses/baaf9127-7703-48b0-8beb-c2b47ccb1bab/required-courses",
        "requiredCreditsUrl": "/api/university/courses/baaf9127-7703-48b0-8beb-c2b47ccb1bab/required-credits",
        "requiredCredits": "0"
    }
]
const otherProgramMandatoryCourses = [
    {
        "id": "84f6b4d2-3aa0-46f3-9268-2db66cd1a506",
        "internalId": "13.27",
        "name": "Electricidad 1",
        "creditValue": 6,
        "url": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505",
        "courseClassesUrl": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505/course-classes",
        "requiredCoursesUrl": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505/required-courses",
        "requiredCreditsUrl": "/api/university/courses/84f6b4d2-3aa0-46f3-9268-2db66cd1a505/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "a151f9a6-de33-41c1-99dc-14cbdaf4a89a",
        "internalId": "93.26",
        "name": "Análisis Matemático I",
        "creditValue": 6,
        "url": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a",
        "courseClassesUrl": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/course-classes",
        "requiredCoursesUrl": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/required-courses",
        "requiredCreditsUrl": "/api/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/required-credits",
        "requiredCredits": "0"
    },
    {
        "id": "fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3",
        "internalId": "93.28",
        "name": "Análisis Matemático II",
        "creditValue": 6,
        "url": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3",
        "courseClassesUrl": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3/course-classes",
        "requiredCoursesUrl": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3/required-courses",
        "requiredCreditsUrl": "/api/university/courses/fe9dee0b-4911-4f9a-b9ef-34f1ad5825a3/required-credits",
        "requiredCredits": "0"
    }
]
const otherProgramOptionalCourses = []

const mandatoryCourses = {}
mandatoryCourses[programs[0].id] = programMandatoryCourses
mandatoryCourses[programs[1].id] = otherProgramMandatoryCourses

const optionalCourses = {}
optionalCourses[programs[0].id] = programOptionalCourses
optionalCourses[programs[1].id] = otherProgramOptionalCourses

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key})
}));

jest.mock("../services/ApiService", () => {
  return {
    parsePagination: jest.fn(),
    getActiveUser: jest.fn(),
    getFinishedCourses: jest.fn(),
    getMandatoryCourses: jest.fn(),
    getOptionalCourses: jest.fn(),
    getRemainingCoursesProgram: jest.fn(),
    deleteFinishedCourse: jest.fn(),
    addFinishedCourse: jest.fn(),
    getPrograms: jest.fn(),
    getCourses: jest.fn(),
  };
});

beforeEach(() => {
    const finishedCourses = [
    {
        "id": "96d107a4-cd12-4fa8-85ec-89e70471b594",
        "internalId": "93.58",
        "name": "Algebra",
        "creditValue": 9,
        "url": "/api/student/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594",
        "courseClassesUrl": "/api/student/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594/course-classes",
        "requiredCoursesUrl": "/api/student/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594/required-courses",
        "requiredCreditsUrl": "/api/student/university/courses/96d107a4-cd12-4fa8-85ec-89e70471b594/required-credits"
    },
    {
        "id": "a151f9a6-de33-41c1-99dc-14cbdaf4a89a",
        "internalId": "93.26",
        "name": "Análisis Matemático I",
        "creditValue": 6,
        "url": "/api/student/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a",
        "courseClassesUrl": "/api/student/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/course-classes",
        "requiredCoursesUrl": "/api/student/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/required-courses",
        "requiredCreditsUrl": "/api/student/university/courses/a151f9a6-de33-41c1-99dc-14cbdaf4a89a/required-credits"
    },
    {
        "id": "3edab61e-1708-4193-aaf6-64e3681cad2a",
        "internalId": "72.03",
        "name": "Intro a la Informática",
        "creditValue": 3,
        "url": "/api/student/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a",
        "courseClassesUrl": "/api/student/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a/course-classes",
        "requiredCoursesUrl": "/api/student/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a/required-courses",
        "requiredCreditsUrl": "/api/student/university/courses/3edab61e-1708-4193-aaf6-64e3681cad2a/required-credits"
    },
    {
        "id": "7516ec8d-a981-489c-97a3-5b1bdd719a15",
        "internalId": "94.24",
        "name": "Metodología del Aprendizaje",
        "creditValue": 3,
        "url": "/api/student/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15",
        "courseClassesUrl": "/api/student/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15/course-classes",
        "requiredCoursesUrl": "/api/student/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15/required-courses",
        "requiredCreditsUrl": "/api/student/university/courses/7516ec8d-a981-489c-97a3-5b1bdd719a15/required-credits"
    },
    {
        "id": "96350fb1-e84d-4be9-8162-dffda44cc612",
        "internalId": "31.08",
        "name": "Sistemas de Representación",
        "creditValue": 3,
        "url": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612",
        "courseClassesUrl": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612/course-classes",
        "requiredCoursesUrl": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612/required-courses",
        "requiredCreditsUrl": "/api/university/courses/96350fb1-e84d-4be9-8162-dffda44cc612/required-credits",
        "requiredCredits": "0"
    }
    ]

    api.getActiveUser.mockImplementation(() => student)
    api.getFinishedCourses.mockImplementation((page) => Promise.resolve( {data: finishedCourses.slice((page-1)*page_size, page*page_size)} ))
    api.getMandatoryCourses.mockImplementation((programId, withRequiredCredits) => Promise.resolve({data: mandatoryCourses[programId]}))
    api.getOptionalCourses.mockImplementation((programId, withRequiredCredits) => Promise.resolve({data: optionalCourses[programId]}))
    api.getRemainingCoursesProgram.mockImplementation((programId, inputText) => {
        return new Promise(async(resolve, reject) => {
            let remainingCourses = []
            mandatoryCourses[programId].filter((c) => {
                let flag = false
                finishedCourses.forEach(f => {if(f.id == c.id) flag = true})
                if(!flag) remainingCourses.push(c)
            })
            optionalCourses[programId].filter((c) => {
                let flag = false
                finishedCourses.forEach(f => {if(f.id == c.id) flag = true})
                if(!flag) remainingCourses.push(c)
            })
            if(!inputText)
                resolve({data: []})
            else{
                const resp = remainingCourses.filter((c) => c.name.toLowerCase().indexOf(inputText.toLowerCase()) !== -1)
                resolve({data: resp})
            }
        });
    })
    api.addFinishedCourse.mockImplementation((courseId) => {
        const allCourses = [...programMandatoryCourses, ...programOptionalCourses, ...otherProgramMandatoryCourses, ...otherProgramOptionalCourses]
        const newCourse = allCourses.find((c) => c.id === courseId)
        finishedCourses.push(newCourse)
        return Promise.resolve({data: finishedCourses})
    })
    api.deleteFinishedCourse.mockImplementation((courseId) => {
        const courseToDelete = finishedCourses.find((c) => c.id == courseId)
        if(courseToDelete)
            finishedCourses.splice(finishedCourses.indexOf(courseToDelete), 1);
        return new Promise((resolve, reject) => {
            resolve({data: finishedCourses})
        });
    })
    api.getCourses.mockImplementation(Promise.resolve({data: [...programMandatoryCourses, ...programOptionalCourses, ...otherProgramMandatoryCourses, ...otherProgramOptionalCourses]}))
    api.getPrograms.mockImplementation((inputText) => Promise.resolve({data: programs.filter((p) => p.name.toLowerCase().includes(inputText.toLowerCase()) || p.internalId.toLowerCase().includes(inputText.toLowerCase()))}))
    api.parsePagination.mockImplementation((response, page) => {
        let arrData = response.headers?.link
        const links = {}
        if(arrData){
            arrData = arrData.split(",")
            for (var d of arrData){
                const linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/ig.exec(d)
                const pageNumber = parseInt(linkInfo[1].split("page=")[1].match(/\d+/))
                links[linkInfo[2]] = pageNumber
            }
        }
        if(links.prev === links.next){
            delete links['prev']
            delete links['next']
            return links
        }
        if(page === links.first) delete links['prev']
        if(page === links.last) delete links['next']
        return links
    })
})

test('List loads finished courses and lists the first page, with modal disabled', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })

    // Initial list
    expect(getByText("93.58")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(getByText("31.08")).toBeInTheDocument()
    expect(() => getByText("11.12")).toThrow()
    expect(() => getByText("93.28")).toThrow()
    expect(() => getByText("93.41")).toThrow()
})

test('Clicking the + button opens the modal, which has the value of the student\'s program', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })

    expect(() => getByRole('dialog')).toThrow()
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})
    const submitButton = getByText('modal.add')
    expect(getByRole("dialog")).toBeInTheDocument()
    expect(getByText("modal.addCourse")).toBeInTheDocument()
    expect(getByText('modal.add')).toBeDisabled()

    expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument()
    expect(() => getByText('E11 - Ingeniería Electricista')).toThrow()
    expect(() => getByText('Q03 - Ingeniería Química')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()
    expect(() => getByText('K07 - Ingeniería Electrónica')).toThrow()
})

test('Modal program select lists all programs if no input is provided', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')

    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument()
    expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument()
    expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument()
    expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument()
    expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument()
})

test('Modal program select filters programs if input matches name', async () => {
    const {getByRole, getById, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    // Test program filter
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })

    // Test input valid "ele"
    fireEvent.change(programInput, { target: { value: 'ele' } })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument()
    expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument()
    expect(() => getByText('S10 - Ingeniería Informática')).toThrow()
    expect(() => getByText('Q03 - Ingeniería Química')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()

    // Test input valid "inf"
    fireEvent.change(programInput, { target: { value: 'inf' } })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument()
    expect(() => getByText('E11 - Ingeniería Electricista')).toThrow()
    expect(() => getByText('Q03 - Ingeniería Química')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()
    expect(() => getByText('K07 - Ingeniería Electrónica')).toThrow()

    // Test input with no matches
    fireEvent.change(programInput, { target: { value: 'example' } })
    await waitFor(() => expect(getByText('selectNoResults')).toBeInTheDocument())
    expect(() => getByText('S10 - Ingeniería Informática')).toThrow()
    expect(() => getByText('E11 - Ingeniería Electricista')).toThrow()
    expect(() => getByText('Q03 - Ingeniería Química')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()
    expect(() => getByText('K07 - Ingeniería Electrónica')).toThrow()
})

test('Modal program select filters programs if input matches internalID', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })

    fireEvent.change(programInput, { target: { value: '1' } })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument()
    expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument()
    expect(() => getByText('K07 - Ingeniería Electrónica')).toThrow()
    expect(() => getByText('Q03 - Ingeniería Química')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()

    fireEvent.change(programInput, { target: { value: '0' } })
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument()
    expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument()
    expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument()
    expect(() => getByText('E11 - Ingeniería Electricista')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()

    // Test input with no matches
    fireEvent.change(programInput, { target: { value: '9' } })
    await waitFor(() => expect(getByText('selectNoResults')).toBeInTheDocument())
    expect(() => getByText('S10 - Ingeniería Informática')).toThrow()
    expect(() => getByText('E11 - Ingeniería Electricista')).toThrow()
    expect(() => getByText('Q03 - Ingeniería Química')).toThrow()
    expect(() => getByText('P22 - Ingeniería en Petróleo')).toThrow()
    expect(() => getByText('K07 - Ingeniería Electrónica')).toThrow()
})

test('Modal course select has a placeholder before text is input', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    // Test program filter
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    fireEvent.click(getByText('E11 - Ingeniería Electricista'))

    const courseSelect = getByTestId('course-select')
    const courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('modal.inputTextToSearch')).toBeInTheDocument())
})

test('Modal course select requires input to show options', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    // Test program filter
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    fireEvent.click(getByText('E11 - Ingeniería Electricista'))

    const courseSelect = getByTestId('course-select')
    const courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('modal.inputTextToSearch')).toBeInTheDocument())
})

test('Modal course select filters results based on input, but only those the student hasn\'t finished', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    // Test program filter
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    fireEvent.click(getByText('E11 - Ingeniería Electricista'))

    const courseSelect = getByTestId('course-select')
    const courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })

    // Input with results
    fireEvent.change(courseInput, { target: { value: 'a' } })
    await waitFor(() => expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument())
    expect(getByText('13.27 - Electricidad 1')).toBeInTheDocument()
    expect(() => getByText('93.26 - Análisis Matemático I')).toThrow()
})

test('Changing selected program resets course input', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')

    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    fireEvent.click(getByText('E11 - Ingeniería Electricista'))

    const courseSelect = getByTestId('course-select')
    const courseInput = getByLabelText('course-select')

    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    fireEvent.change(courseInput, { target: { value: 'a' } })
    await waitFor(() => expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument())
    expect(getByText('13.27 - Electricidad 1')).toBeInTheDocument()


    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    fireEvent.click(getByText('S10 - Ingeniería Informática'))
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('modal.inputTextToSearch')).toBeInTheDocument())
})

test('Modal course select only shows unfinished courses that are part of selected program', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')

    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    fireEvent.click(getByText('E11 - Ingeniería Electricista'))

    // See what courses E11 has
    let courseSelect = getByTestId('course-select')
    let courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    fireEvent.change(courseInput, { target: { value: 'a' } })
    await waitFor(() => expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument())
    expect(getByText('13.27 - Electricidad 1')).toBeInTheDocument()
    expect(() => getByText('61.23 - Economía para Ingenieros')).toThrow()


    // Change program to S10
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    fireEvent.click(getByText('S10 - Ingeniería Informática'))
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('modal.inputTextToSearch')).toBeInTheDocument())

    // See what courses S10 has
    courseSelect = getByTestId('course-select')
    courseInput = getByLabelText('course-select')
    fireEvent.change(courseInput, { target: { value: 'a' } })
    await waitFor(() => expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument())
    expect(getByText('61.23 - Economía para Ingenieros')).toBeInTheDocument()
    expect(() => getByText('13.27 - Electricidad 1')).toThrow()
})

test('Modal course select filters courses by input', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')

    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    fireEvent.click(getByText('S10 - Ingeniería Informática'))

    let courseSelect = getByTestId('course-select')
    let courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    fireEvent.change(courseInput, { target: { value: 'a' } })
    await waitFor(() => expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument())
    expect(getByText('97.35 - Arquitectura de Computadoras')).toBeInTheDocument()
    expect(getByText('72.39 - Autómatas, Teoría de Lenguajes y Compiladores')).toBeInTheDocument()
    expect(getByText('93.41 - Física I')).toBeInTheDocument()
    expect(() => getByText('93.07 - Métodos Numéricos')).toThrow()

    fireEvent.change(courseInput, { target: { value: 'u' } })
    await waitFor(() => expect(getByText('93.07 - Métodos Numéricos')).toBeInTheDocument())
    expect(getByText('97.35 - Arquitectura de Computadoras')).toBeInTheDocument()
    expect(getByText('72.39 - Autómatas, Teoría de Lenguajes y Compiladores')).toBeInTheDocument()
    expect(() => getByText('93.41 - Física I')).toThrow()
    expect(() => getByText('93.28 - Análisis Matemático II')).toThrow()
})

test('Adding course should add it to finishedCourses and previous tests should apply with newly added course', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})

    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')

    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    fireEvent.click(getByText('S10 - Ingeniería Informática'))

    let courseSelect = getByTestId('course-select')
    let courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    fireEvent.change(courseInput, { target: { value: 'a' } })
    await waitFor(() => expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument())
    fireEvent.click(getByText('93.28 - Análisis Matemático II'))

    const addCourseButton = getByText('modal.add')
    await act(async() => {addCourseButton.click()})

    expect(getByText("93.58")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(getByText("31.08")).toBeInTheDocument()
    expect(getByText("93.28")).toBeInTheDocument()
})

test('Attempting to delete a course opens a modal asking for confirmation', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })

    // Delete third element in list
    const deleteMetodologiaButton = getByTestId('trash-3')
    await act(async() => {deleteMetodologiaButton.click()})
    await waitFor(() => expect(getByText('modal.areYouSureCourse')).toBeInTheDocument())
    expect(getByText("modal.cancel")).toBeInTheDocument()
    expect(getByText("modal.delete")).toBeInTheDocument()
})

test('Deleting a finished course removes it from the list', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    expect(getByText("93.58")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(getByText("31.08")).toBeInTheDocument()

    // Delete third element in list
    const deleteMetodologiaButton = getByTestId('trash-3')
    await act(async() => {deleteMetodologiaButton.click()})
    await waitFor(() => expect(getByText('modal.areYouSureCourse')).toBeInTheDocument())

    const confirmDeleteButton = getByText("modal.delete")
    await act(async() => {confirmDeleteButton.click()})
    await waitFor(() => expect(() => getByText('modal.areYouSureCourse')).toThrow())

    // Metodologia is no longer in the list
    expect(getByText("93.58")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(() => getByText('94.24')).toThrow()
    expect(getByText("31.08")).toBeInTheDocument()
})

test('Deleting a finished course adds it back to the addCourse modal', async () => {
    const {getByRole, asFragment, getByLabelText, getByText, getByTestId, getElementsByClassName} = render(<Router><StudentCourseLog student={api.getActiveUser()}/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })

    // Open modal
    let plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    let programSelect = getByTestId('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    fireEvent.click(getByText('S10 - Ingeniería Informática'))

    // Check Metodologia can't be added
    let courseSelect = getByTestId('course-select')
    let courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    fireEvent.change(courseInput, { target: { value: 'me' } })
    await waitFor(() => expect(getByText('72.32 - Procesamiento de Documentos XML')).toBeInTheDocument())
    expect(() => getByText('93.26 - Metodología del Aprendizaje')).toThrow()

    let cancelButton = getByText("modal.cancel")
    await act(async() => {cancelButton.click()})
    await waitFor(() => expect(() => getByText('modal.cancel')).toThrow())

    // Delete third element in list
    const deleteMetodologiaButton = getByTestId('trash-3')
    await act(async() => {deleteMetodologiaButton.click()})
    await waitFor(() => expect(getByText('modal.areYouSureCourse')).toBeInTheDocument())
    const confirmDeleteButton = getByText("modal.delete")
    await act(async() => {confirmDeleteButton.click()})
    await waitFor(() => expect(() => getByText('modal.areYouSureCourse')).toThrow())

    // Open modal again
    plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })
    programSelect = getByTestId('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    fireEvent.click(getByText('S10 - Ingeniería Informática'))

    // Check Metodologia can now be added
    courseSelect = getByTestId('course-select')
    courseInput = getByLabelText('course-select')
    fireEvent.keyDown(courseSelect.firstChild, { key: 'ArrowDown' })
    fireEvent.change(courseInput, { target: { value: 'me' } })
    await waitFor(() => expect(getByText('72.32 - Procesamiento de Documentos XML')).toBeInTheDocument())
    expect(getByText('94.24 - Metodología del Aprendizaje')).toBeInTheDocument()
})
