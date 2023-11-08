import React from 'react';
import { render, waitFor, queryByAttribute, fireEvent, act, screen } from '@testing-library/react';
import { when } from 'jest-when';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import selectEvent from 'react-select-event'
import { Link, BrowserRouter as Router } from 'react-router-dom';
import SignUpStudentForm from '../components/Accounts/SignUpStudentForm';
import * as api from '../services/ApiService'

const universities = [
    {
        "id": "65497a6890e029008071327e",
        "name": "UBA",
        "verified": true,
        "url": "/api/universities/65497a6890e029008071327e",
        "coursesUrl": "/api/universities/65497a6890e029008071327e/courses",
        "programsUrl": "/api/universities/65497a6890e029008071327e/programs",
        "buildingsUrl": "/api/universities/65497a6890e029008071327e/buildings",
        "termsUrl": "/api/universities/65497a6890e029008071327e/terms",
        "studentsUrl": "/api/universities/65497a6890e029008071327e/students",
        "courseClassesUrl": "/api/universities/65497a6890e029008071327e/course-classes"
    },
    {
        "id": "6520e48eb5aa5394ebd5b520",
        "name": "ITBA",
        "verified": true,
        "url": "/api/universities/6520e48eb5aa5394ebd5b520",
        "coursesUrl": "/api/universities/6520e48eb5aa5394ebd5b520/courses",
        "programsUrl": "/api/universities/6520e48eb5aa5394ebd5b520/programs",
        "buildingsUrl": "/api/universities/6520e48eb5aa5394ebd5b520/buildings",
        "termsUrl": "/api/universities/6520e48eb5aa5394ebd5b520/terms",
        "studentsUrl": "/api/universities/6520e48eb5aa5394ebd5b520/students",
        "courseClassesUrl": "/api/universities/6520e48eb5aa5394ebd5b520/course-classes"
    }
]
const itbaPrograms = [
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
const ubaPrograms = [
    {
        "id": "489fc504-0f46-4d09-bced-ad863cecab02",
        "internalId": "F",
        "name": "Filosofía",
        "optionalCourseCredits": 27,
        "url": "/api/student/university/programs/489fc504-0f46-4d09-bced-ad863cecab02",
        "coursesUrl": "/api/student/university/programs/489fc504-0f46-4d09-bced-ad863cecab02/courses"
    },
    {
        "id": "9f23e5cc-744b-45de-be24-f810ea9d9a79",
        "internalId": "D",
        "name": "Derecho",
        "optionalCourseCredits": 16,
        "url": "/api/student/university/programs/9f23e5cc-744b-45de-be24-f810ea9d9a79",
        "coursesUrl": "/api/student/university/programs/9f23e5cc-744b-45de-be24-f810ea9d9a79/courses"
    }
]
const programs = {
    '65497a6890e029008071327e': ubaPrograms,
    '6520e48eb5aa5394ebd5b520': itbaPrograms
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key})
}));

jest.mock("../services/ApiService", () => {
  return {
    getUniversities: jest.fn(),
    getProgramsOfUniversity: jest.fn(),
    registerStudent: jest.fn(),
    login: jest.fn()
  };
});

beforeEach(() => {
    api.getUniversities.mockImplementation((inputText) => Promise.resolve(
        {
            data: universities.filter((u) => u.name.toLowerCase().includes(inputText.toLowerCase()))
        }
    ))

    when(api.getProgramsOfUniversity).mockImplementation((universityId, inputText) => Promise.resolve(
        {
            data: programs[universityId].filter((p) => p.name.toLowerCase().includes(inputText.toLowerCase()) || p.internalId.toLowerCase().includes(inputText.toLowerCase()))
        }
    ))

    api.registerStudent.mockImplementation((name, email, password, universityId, programId) => {
        if(email === "estudiante1@itba.edu.ar"){
            return Promise.resolve({status: "USER_ALREADY_EXISTS"})
        }
        return Promise.resolve({status: 200})
    })
    api.login.mockResolvedValue({status: 200})
})

test('Successfully completed form disables button and shows no errors', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })
    await waitFor(() => expect(getByTestId('school-select')).toBeInTheDocument())

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    // Errors that shouldn't appear:
    await waitFor(() => expect(() => getByText('register.errors.studentName.isRequired')).toThrow())
    await waitFor(() => expect(() => getByText('register.errors.email.isRequired')).toThrow())
    await waitFor(() => expect(() => getByText('register.errors.email.invalidEmail')).toThrow())
    await waitFor(() => expect(() => getByText('register.errors.email.maxLength')).toThrow())

    await waitFor(() => expect(() => getByText('register.errors.password.isRequired')).toThrow())
    await waitFor(() => expect(() => getByText('register.errors.password.requiredLength')).toThrow())
    await waitFor(() => expect(() => getByText('register.errors.password.maxLength')).toThrow())
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    await waitFor(() => expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow())
    await waitFor(() => expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow())

    await waitFor(() => expect(() => getByText('register.errors.school.programNotSelected')).toThrow())
})

test('Form displays errors relating to each missing field', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(getByText('register.errors.studentName.isRequired')).toBeInTheDocument()
    expect(getByText('register.errors.email.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    expect(getByText('register.errors.repeatPassword.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no name provided', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(emailInput, { target: { value: 'tester@yahoo.com' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(getByText('register.errors.studentName.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when name is too long', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Jugemu Jugemu Gokou no surikire Kaijarisuigyo no Suigyomatsu Unraimatsu Fuuraimatsu Kuunerutokoro ni Sumutokoro' } })
    fireEvent.change(emailInput, { target: { value: 'tester@yahoo.com' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(getByText('register.errors.studentName.maxLength')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no email provided', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(getByText('register.errors.email.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when email is invalid', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'myEmail' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(getByText('register.errors.email.invalidEmail')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
})

test('Form displays error when email is too long', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'imbluedabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeibelieveimaguy' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(getByText('register.errors.email.maxLength')).toBeInTheDocument()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no passwords are provided', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()
    expect(getByText('register.errors.repeatPassword.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when only first password is provided', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'Hola1234' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()
    expect(getByText('register.errors.repeatPassword.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when only second password is provided', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput2, { target: { value: 'Hola1234' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(getByText('register.errors.repeatPassword.passwordsMismatch')).toBeInTheDocument()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when password is too short', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'H2o' } })
    fireEvent.change(passInput2, { target: { value: 'H2o' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(getByText('register.errors.password.requiredLength')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.requiredCharacters')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when password does not match regexp', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'mypassword' } })
    fireEvent.change(passInput2, { target: { value: 'mypassword' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(getByText('register.errors.password.requiredCharacters')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()

    // Only uppercase
    fireEvent.change(passInput1, { target: { value: 'MYPASSWORD' } })
    fireEvent.change(passInput2, { target: { value: 'MYPASSWORD' } })
    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })
    expect(getByText('register.errors.password.requiredCharacters')).toBeInTheDocument()

    // Only numbers
    fireEvent.change(passInput1, { target: { value: '123456789' } })
    fireEvent.change(passInput2, { target: { value: '123456789' } })
    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })
    expect(getByText('register.errors.password.requiredCharacters')).toBeInTheDocument()

    // Mixed letters
    fireEvent.change(passInput1, { target: { value: 'Mypassword' } })
    fireEvent.change(passInput2, { target: { value: 'Mypassword' } })
    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })
    expect(getByText('register.errors.password.requiredCharacters')).toBeInTheDocument()

    // Lower + number
    fireEvent.change(passInput1, { target: { value: 'mypassword123' } })
    fireEvent.change(passInput2, { target: { value: 'mypassword123' } })
    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })
    expect(getByText('register.errors.password.requiredCharacters')).toBeInTheDocument()

    // Upper + number
    fireEvent.change(passInput1, { target: { value: 'MYPASSWORD123' } })
    fireEvent.change(passInput2, { target: { value: 'MYPASSWORD123' } })
    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })
    expect(getByText('register.errors.password.requiredCharacters')).toBeInTheDocument()

    // Add number
    fireEvent.change(passInput1, { target: { value: 'Mypassword123' } })
    fireEvent.change(passInput2, { target: { value: 'Mypassword123' } })
    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })
    expect(() => getByText('register.errors.school.requiredCharacters')).toThrow()
})

test('Form displays error when password is too long', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'imbluedabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadye' } })
    fireEvent.change(passInput2, { target: { value: 'imbluedabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadye' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(getByText('register.errors.password.maxLength')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test("Form displays error when passwords don't match", async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'Mypassword123' } })
    fireEvent.change(passInput2, { target: { value: 'Mypassword124' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))

    // Choose Petróleo
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')
    fireEvent.keyDown(programSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('S10 - Ingeniería Informática')).toBeInTheDocument())
    await waitFor(() => expect(getByText('E11 - Ingeniería Electricista')).toBeInTheDocument())
    await waitFor(() => expect(getByText('K07 - Ingeniería Electrónica')).toBeInTheDocument())
    await waitFor(() => expect(getByText('P22 - Ingeniería en Petróleo')).toBeInTheDocument())
    await waitFor(() => expect(getByText('Q03 - Ingeniería Química')).toBeInTheDocument())
    fireEvent.click(getByText('P22 - Ingeniería en Petróleo'))

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(getByText('register.errors.repeatPassword.passwordsMismatch')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no school is selected', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'Mypassword123' } })
    fireEvent.change(passInput2, { target: { value: 'Mypassword123' } })

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(getByText('register.errors.school.programNotSelected')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no program is selected', async () => {
    const {asFragment, getByLabelText, getByText, getByTestId} = render(<Router><SignUpStudentForm/></Router>)
    const user = userEvent.setup()

    const nameInput = await screen.getByPlaceholderText("register.placeholders.nameStudent")
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(nameInput, { target: { value: 'Tester' } })
    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput1, { target: { value: 'Mypassword123' } })
    fireEvent.change(passInput2, { target: { value: 'Mypassword123' } })

    // Choose ITBA
    const schoolSelect = getByTestId('school-select')
    const schoolInput = getByLabelText('school-select')
    fireEvent.keyDown(schoolSelect.firstChild, { key: 'ArrowDown' })
    await waitFor(() => expect(getByText('UBA')).toBeInTheDocument())
    await waitFor(() => expect(getByText('ITBA')).toBeInTheDocument())
    fireEvent.click(getByText('ITBA'))
    const programSelect = getByTestId('program-select')
    const programInput = getByLabelText('program-select')

    user.click(submitButton)
    await waitFor(() => { expect(submitButton).toBeDisabled() })
    await waitFor(() => { expect(submitButton).toBeEnabled() })

    expect(() => getByText('register.errors.studentName.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(getByText('register.errors.school.programNotSelected')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
})
