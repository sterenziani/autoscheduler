import React from 'react';
import { render, waitFor, queryByAttribute, fireEvent, act, screen } from '@testing-library/react';
import { when } from 'jest-when';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import selectEvent from 'react-select-event'
import { Link, BrowserRouter as Router } from 'react-router-dom';
import StudentCourseLog from '../components/Lists/StudentCourseLog';
import * as api from '../services/ApiService'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key})
}));

jest.mock("../services/ApiService", () => {
  return {
    getActiveUser: jest.fn(),
    getFinishedCourses: jest.fn(),
    getRemainingCoursesProgram: jest.fn(),
    deleteFinishedCourse: jest.fn(),
    addFinishedCourse: jest.fn(),
    getPrograms: jest.fn(),
    getCourses: jest.fn()
  };
});

let finishedCourses = [
    {
        id: '31.08', internalId: '31.08',
        name: 'Sistemas de Representación',
        requirements: {1:[]}
    },
    {
        id: '72.03', internalId: '72.03',
        name: 'Introducción a la Informática',
        requirements: {1:[]}
    },
    {
        id: '94.24', internalId: '94.24',
        name: 'Metodología del Aprendizaje',
        requirements: {1:[]}
    },
    {
        id: '93.26', internalId: '93.26',
        name: 'Análisis Matemático I',
        requirements: {1:[]}
    },
    {
        id: '93.58', internalId: '93.58',
        name: 'Algebra',
        requirements: {1:[]}
    }
]

beforeEach(() => {
    const student = {
        id: 1, type: 'STUDENT', email: 'student@itba.edu.ar',
        university: { id: 9, name: 'Instituto Tecnológico de Buenos Aires' },
        program: { id: 1, name: 'S10 - Ingeniería Informática' }
    }
    const university = {
        id: 9, type: 'UNIVERSITY', email: 'rector@itba.edu.ar',
        name: 'Instituto Tecnológico de Buenos Aires', verified: false
    }
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
    finishedCourses = [
        {
            id: '31.08', internalId: '31.08',
            name: 'Sistemas de Representación',
            requirements: {1:[]}
        },
        {
            id: '72.03', internalId: '72.03',
            name: 'Introducción a la Informática',
            requirements: {1:[]}
        },
        {
            id: '94.24', internalId: '94.24',
            name: 'Metodología del Aprendizaje',
            requirements: {1:[]}
        },
        {
            id: '93.26', internalId: '93.26',
            name: 'Análisis Matemático I',
            requirements: {1:[]}
        },
        {
            id: '93.58', internalId: '93.58',
            name: 'Algebra',
            requirements: {1:[]}
        }
    ]

    api.getActiveUser.mockImplementation(() => student)
    api.getFinishedCourses.mockResolvedValue(finishedCourses)
    api.getRemainingCoursesProgram.mockImplementation((user, program, inputText) => {
        return new Promise(async(resolve, reject) => {
            let remainingCourses = []
            courses[program].filter((c) => {
                let flag = false
                finishedCourses.forEach(f => {
                    if(f.id == c.id)
                        flag = true
                })
                if(!flag)
                    remainingCourses.push(c)
            })
            if(!inputText)
                resolve(courses[program])
            else{
                const resp = remainingCourses.filter((c) => c.name.toLowerCase().indexOf(inputText.toLowerCase()) !== -1)
                resolve(resp)
            }
        });
    })
    api.addFinishedCourse.mockImplementation((student, courseId) => {
        const allCourses = [...courses[1], ...courses[2]]
        const newCourse = allCourses.find((c) => c.id === courseId)
        finishedCourses.push(newCourse)
        return new Promise((resolve, reject) => {
            resolve(finishedCourses)
        });
    })
    api.deleteFinishedCourse.mockImplementation((student, courseId) => {
        const courseToDelete = finishedCourses.find((c) => c.id == courseId)
        if(courseToDelete)
            finishedCourses.splice(finishedCourses.indexOf(courseToDelete), 1);
        return new Promise((resolve, reject) => {
            resolve(finishedCourses)
        });
    })
    api.getCourses.mockResolvedValue([...courses[1], ...courses[2]])
    api.getPrograms.mockImplementation((universityId, inputText) => {
        const programs = [
            { id: 2, internalId: 'I22', name: 'Ingeniería Industrial' },
            { id: 1, internalId: 'S10', name: 'Ingeniería Informática' },
            { id: 3, internalId: 'I13', name: 'Ingeniería Industrial' },
        ]
        const resp = programs.filter((p) => p.name.toLowerCase().indexOf(inputText.toLowerCase()) !== -1)
        return new Promise((resolve, reject) => {
            resolve(resp)
        });
    })
})

test('Choosing a course from the modal adds it to the list and closes modal', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><StudentCourseLog/></Router>)
    await waitFor(() => { expect(getByTestId("content")).toBeInTheDocument() })

    // Initial list
    expect(getByText("31.08")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(getByText("93.58")).toBeInTheDocument()
    expect(() => getByText("11.12")).toThrow()
    expect(() => getByText("93.28")).toThrow()
    expect(() => getByText("93.41")).toThrow()

    const plusButton = getByTestId("plus-button")
    await act(async() => {plusButton.click()})
    const submitButton = getByText('modal.add')
    expect(getByText("modal.addCourse")).toBeInTheDocument()
    expect(getByText('modal.add')).toBeDisabled()

    // Test program filter
    const programInput = getByLabelText('program-select')
    let courseInput
    expect(programInput.value).toBe('S10 - Ingeniería Informática');
    await act(async() => {
        fireEvent.change(programInput, { target: { value: '' } })
        userEvent.type(programInput, "in")
    })
    expect(getByText('I22 - Ingeniería Industrial')).toBeInTheDocument()
    expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument()
    expect(getByText('I13 - Ingeniería Industrial')).toBeInTheDocument()

    // Test S10 filter
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    courseInput = getByLabelText('course-select')
    await act(async() => { userEvent.type(courseInput, "a") })
    expect(getByText('93.41 - Física I')).toBeInTheDocument()
    expect(() => getByText('11.12 - Materia para Industriales')).toThrow()
    expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument()

    // Test I13 filter
    await selectEvent.select(getByLabelText('program-select'), 'I13 - Ingeniería Industrial')
    courseInput = getByLabelText('course-select')
    await act(async() => { userEvent.type(courseInput, "a") })
    expect(getByText('93.41 - Física I')).toBeInTheDocument()
    expect(getByText('11.12 - Materia para Industriales')).toBeInTheDocument()
    expect(() => getByText('93.28 - Análisis Matemático II')).toThrow()

    // Test combined finished courses list
    await selectEvent.select(getByLabelText('course-select'), '11.12 - Materia para Industriales')
    expect(getByText('modal.add')).toBeEnabled()
    await act(async() => {userEvent.click(getByText('modal.add'))})
    await waitFor(() => {expect(() => getByText("modal.addCourse")).toThrow()})
    expect(getByText("31.08")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(getByText("93.58")).toBeInTheDocument()
    expect(getByText("11.12")).toBeInTheDocument()
    expect(() => getByText("93.41")).toThrow()
    expect(() => getByText("93.28")).toThrow()
})

test('Course selects should only show matching query results', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><StudentCourseLog/></Router>)
    await waitFor(() => {
        expect(getByTestId("content")).toBeInTheDocument()
    })
    const plusButton = getByTestId("plus-button")
    await act(async() => {
        plusButton.click()
    })

    // Test text filter
    const courseInput = getByLabelText('course-select')
    await act(async() => {
        userEvent.type(courseInput, "pro")
    })
    expect(getByText('72.31 - Programación Imperativa')).toBeInTheDocument()
    expect(getByText('72.32 - Diseño y Procesamiento de Documentos XML')).toBeInTheDocument()
    expect(getByText('72.33 - Programación Orientada a Objetos')).toBeInTheDocument()
    expect(getByText('93.24 - Probabilidad y Estadística')).toBeInTheDocument()
    expect(() => getByText('93.26 - Análisis Matemático I')).toThrow()

    // Clear and try again
    await act(async() => {
        fireEvent.change(courseInput, { target: { value: '' } })
        userEvent.type(courseInput, "prog")
    })
    expect(getByText('72.31 - Programación Imperativa')).toBeInTheDocument()
    expect(() => getByText('72.32 - Diseño y Procesamiento de Documentos XML')).toThrow()
    expect(getByText('72.33 - Programación Orientada a Objetos')).toBeInTheDocument()
    expect(() => getByText('93.24 - Probabilidad y Estadística')).toThrow()
    expect(() => getByText('93.26 - Análisis Matemático I')).toThrow()

    // Check for finished courses
    await act(async() => {
        fireEvent.change(courseInput, { target: { value: '' } })
        userEvent.type(courseInput, "matem")
    })
    expect(() => getByText('93.26 - Análisis Matemático I')).toThrow()
    expect(getByText('93.59 - Matemática Discreta')).toBeInTheDocument()
    expect(getByText('93.28 - Análisis Matemático II')).toBeInTheDocument()
})

test('Clicking a trash can deletes that element from list and is added to modal select again', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><StudentCourseLog/></Router>)
    await waitFor(() => {expect(getByTestId("content")).toBeInTheDocument()})

    // Initial courses
    expect(getByText("31.08")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(getByText("93.26")).toBeInTheDocument()
    expect(getByText("93.58")).toBeInTheDocument()

    // Delete course
    await act(async() => {userEvent.click(getByTestId("trash-3"))})
    expect(getByText("modal.deleteCourse")).toBeInTheDocument()
    const deleteButton = getByText("modal.delete")
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton).toBeEnabled()
    await act(async() => {userEvent.click(deleteButton)})

    // Final courses
    expect(getByText("31.08")).toBeInTheDocument()
    expect(getByText("72.03")).toBeInTheDocument()
    expect(getByText("94.24")).toBeInTheDocument()
    expect(() => getByText("93.26")).toThrow()
    expect(getByText("93.58")).toBeInTheDocument()
})
