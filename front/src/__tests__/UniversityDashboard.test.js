import React from 'react';
import { render, waitFor, queryByAttribute, fireEvent, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import { Link, BrowserRouter as Router } from 'react-router-dom';
import HomePageUniversity from '../components/HomePageUniversity';
import * as api from '../services/ApiService'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key})
}));

jest.mock("../services/ApiService", () => {
  return {
    getActiveUser: jest.fn(),
    getBuildings: jest.fn(),
    getProgramsPage: jest.fn(),
    getCoursesPage: jest.fn(),
    getTerms: jest.fn()
  };
});

const university = {
    id: 9, type: 'UNIVERSITY', email: 'rector@itba.edu.ar',
    name: 'Instituto Tecnológico de Buenos Aires', verified: false
}

beforeEach(() => {
    const informaticaCourses = [
            {
                id: '31.08',
                internalId: '31.08',
                name: 'Sistemas de Representación',
                requirements: {1:[], 2:[], 3:[]}
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
            }
        ]
    const industrialCourses = [
            {
                id: '93.41',
                internalId: '93.41',
                name: 'Física I',
                requirements: {1:['93.26']},
            },
            {
                id: '11.12', internalId: '11.12',
                name: 'Materia para Industriales',
                requirements: {2:[], 3:[]}
            }
        ]
    const courses = {1: informaticaCourses, 2: industrialCourses, 3: industrialCourses}

    api.getActiveUser.mockImplementation(() => student)
    api.getTerms.mockImplementation((universityId, page) => {
        const terms = [
            { id: 6, internalId: '2021-2Q', name: '2° Cuatrimestre 2021', startDate: '2021-08-01', published: true },
            { id: 5, internalId: '2022-1Q', name: '1° Cuatrimestre 2022', startDate: '2022-03-01', published: true },
            { id: 7, internalId: '2022-2Q', name: '2° Cuatrimestre 2022', startDate: '2022-08-01', published: false },
        ]
        return new Promise((resolve, reject) => {
            resolve(terms.splice((page-1)*2, (page-1)*2+2))
        });
    })
    api.getBuildings.mockImplementation((universityId, page) => {
        const buildings = [
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
        ]
        return new Promise((resolve, reject) => {
            resolve(buildings.splice((page-1)*2, (page-1)*2+2))
        });
    })
    api.getCoursesPage.mockResolvedValue((universityId, page) => {
        const resp = [...courses[1], ...courses[2]]
        return new Promise((resolve, reject) => {
            resolve(resp.splice((page-1)*5, (page-1)*5+5))
        });
    })
    api.getProgramsPage.mockImplementation((universityId, page) => {
        const programs = [
            { id: 2, internalId: 'I22', name: 'Ingeniería Industrial' },
            { id: 1, internalId: 'S10', name: 'Ingeniería Informática' },
            { id: 3, internalId: 'I13', name: 'Ingeniería Industrial' },
        ]
        return new Promise((resolve, reject) => {
            resolve(programs.splice((page-1)*2, (page-1)*2+2))
        });
    })
})

test('Clicking a tab changes active one and displayed content', async () => {
    await act(async() => {
        render(<Router><HomePageUniversity user={university}/></Router>)
    })
    const tabs = await screen.getByLabelText("home-tabs")
    const buildingsTab = await screen.getByText("tabs.buildings")
    const programsTab = await screen.getByText("tabs.programs")
    const coursesTab = await screen.getByText("tabs.courses")
    const termsTab = await screen.getByText("tabs.terms")

    // Check default tab is Programs
    expect(buildingsTab.classList.contains('active')).toBe(false)
    expect(programsTab.classList.contains('active')).toBe(true)
    expect(coursesTab.classList.contains('active')).toBe(false)
    expect(termsTab.classList.contains('active')).toBe(false)

    // Check buildings tab works
    await act(async() => {
        userEvent.click(buildingsTab)
    })
    expect(buildingsTab.classList.contains('active')).toBe(true)
    expect(programsTab.classList.contains('active')).toBe(false)
    expect(coursesTab.classList.contains('active')).toBe(false)
    expect(termsTab.classList.contains('active')).toBe(false)

    // Check programs tab works
    await act(async() => {
        userEvent.click(programsTab)
    })
    expect(buildingsTab.classList.contains('active')).toBe(false)
    expect(programsTab.classList.contains('active')).toBe(true)
    expect(coursesTab.classList.contains('active')).toBe(false)
    expect(termsTab.classList.contains('active')).toBe(false)

    // Check courses tab works
    await act(async() => {
        userEvent.click(coursesTab)
    })
    expect(buildingsTab.classList.contains('active')).toBe(false)
    expect(programsTab.classList.contains('active')).toBe(false)
    expect(coursesTab.classList.contains('active')).toBe(true)
    expect(termsTab.classList.contains('active')).toBe(false)

    // Check terms tab works
    await act(async() => {
        userEvent.click(termsTab)
    })
    expect(buildingsTab.classList.contains('active')).toBe(false)
    expect(programsTab.classList.contains('active')).toBe(false)
    expect(coursesTab.classList.contains('active')).toBe(false)
    expect(termsTab.classList.contains('active')).toBe(true)
})

test('Changing pages changes URL', async () => {
    let container
    await act(async() => {
        container = render(<Router><HomePageUniversity user={university}/></Router>)
    })
    const tabs = await screen.getByLabelText("home-tabs")
    const buildingsTab = await screen.getByText("tabs.buildings")
    const programsTab = await screen.getByText("tabs.programs")
    const coursesTab = await screen.getByText("tabs.courses")
    const termsTab = await screen.getByText("tabs.terms")

    let pageBackButtons = await container.container.querySelectorAll(".bi-arrow-left-circle-fill")
    let pageNumbers = await container.container.querySelectorAll(".page-number")
    let pageNextButtons = await container.container.querySelectorAll(".bi-arrow-right-circle-fill")

    // Check buildings tab works
    await act(async() => {
        userEvent.click(buildingsTab)
        userEvent.click(pageNextButtons[0])
    })
    pageBackButtons = await container.container.querySelectorAll(".bi-arrow-left-circle-fill")
    pageNumbers = await container.container.querySelectorAll(".page-number")
    pageNextButtons = await container.container.querySelectorAll(".bi-arrow-right-circle-fill")
    expect(buildingsTab.classList.contains('active')).toBe(true)
    expect(programsTab.classList.contains('active')).toBe(false)
    expect(coursesTab.classList.contains('active')).toBe(false)
    expect(termsTab.classList.contains('active')).toBe(false)
    expect(window.location.href).toBe("http://localhost/?tab=buildings&page=2")
    expect(pageNumbers[0].innerHTML).toBe("Page 2")
    expect(pageNextButtons[0].classList.contains('disabled')).toBe(true)
    await act(async() => {
        userEvent.click(pageBackButtons[0])
    })
    pageBackButtons = await container.container.querySelectorAll(".bi-arrow-left-circle-fill")
    pageNumbers = await container.container.querySelectorAll(".page-number")
    pageNextButtons = await container.container.querySelectorAll(".bi-arrow-right-circle-fill")
    expect(window.location.href).toBe("http://localhost/?tab=buildings&page=1")
    expect(pageNumbers[0].innerHTML).toBe("Page 1")
    expect(pageBackButtons[0].classList.contains('disabled')).toBe(true)

    // Check programs tab works
    await act(async() => {
        userEvent.click(programsTab)
        userEvent.click(pageNextButtons[1])
    })
    pageBackButtons = await container.container.querySelectorAll(".bi-arrow-left-circle-fill")
    pageNumbers = await container.container.querySelectorAll(".page-number")
    pageNextButtons = await container.container.querySelectorAll(".bi-arrow-right-circle-fill")
    expect(buildingsTab.classList.contains('active')).toBe(false)
    expect(programsTab.classList.contains('active')).toBe(true)
    expect(coursesTab.classList.contains('active')).toBe(false)
    expect(termsTab.classList.contains('active')).toBe(false)
    expect(window.location.href).toBe("http://localhost/?tab=programs&page=2")
    expect(pageNumbers[1].innerHTML).toBe("Page 2")

    // Check courses tab works and that page numbers are independent from one another
    await act(async() => {
        userEvent.click(coursesTab)
    })
    pageBackButtons = await container.container.querySelectorAll(".bi-arrow-left-circle-fill")
    pageNumbers = await container.container.querySelectorAll(".page-number")
    pageNextButtons = await container.container.querySelectorAll(".bi-arrow-right-circle-fill")
    expect(buildingsTab.classList.contains('active')).toBe(false)
    expect(programsTab.classList.contains('active')).toBe(false)
    expect(coursesTab.classList.contains('active')).toBe(true)
    expect(termsTab.classList.contains('active')).toBe(false)
    expect(window.location.href).toBe("http://localhost/?tab=programs&page=2") // URL is not updated yet
    expect(pageNumbers[2].innerHTML).toBe("Page 1") //Page reflects the current tab
})
