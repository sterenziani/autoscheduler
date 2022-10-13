import React from 'react';
import { render, queryByAttribute, fireEvent, act, screen } from '@testing-library/react';
import { when } from 'jest-when';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import selectEvent from 'react-select-event'
import { Link, BrowserRouter as Router } from 'react-router-dom';
import SignUpStudentForm from '../components/Accounts/SignUpStudentForm';
import * as api from '../services/ApiService'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key})
}));

jest.mock("../services/ApiService", () => {
  return {
    getUniversities: jest.fn(),
    getPrograms: jest.fn(),
    registerStudent: jest.fn(),
    login: jest.fn()
  };
});

beforeEach(() => {
    api.getUniversities.mockResolvedValue(
        [
            { id: 1, name: 'Academia para Astronautas' },
            { id: 2, name: 'Bachiller para Bochincheros' },
            { id: 3, name: 'Colegio Nacional de las Artes' },
            { id: 9, name: 'Instituto Tecnológico de Buenos Aires' },
        ]
    )

    when(api.getPrograms).calledWith(9, '').mockResolvedValue(
        [
            { id: 2, internalId: 'I22', name: 'Ingeniería Industrial' },
            { id: 1, internalId: 'S10', name: 'Ingeniería Informática' },
            { id: 3, internalId: 'I13', name: 'Ingeniería Industrial' },
        ]
    ).calledWith(1, '').mockResolvedValue(
        [
            { id: 4, internalId: 'A1', name: 'Only Program' },
        ]
    ).defaultResolvedValue([])

    api.registerStudent.mockResolvedValue({status: 201})
    api.login.mockResolvedValue({status: 200})
})

test('Successfully completed form disables button and shows no errors', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante1")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
    // Errors that shouldn't appear:
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()

    expect(submitButton).toBeDisabled()
})

test('Form displays errors relating to each missing field', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.click(submitButton)
    })
    expect(getByText('register.errors.email.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()

    expect(getByText('register.errors.repeatPassword.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no email provided', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante1")
        userEvent.click(submitButton)
    })
    expect(getByText('register.errors.email.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when email is invalid', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "myEmail")
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante1")
        userEvent.click(submitButton)
    })
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(getByText('register.errors.email.invalidEmail')).toBeInTheDocument()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when email is too long', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "imbluedabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadye@Dabadeedaba.dye")
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante1")
        userEvent.click(submitButton)
    })
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(getByText('register.errors.email.maxLength')).toBeInTheDocument()

    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()

    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()

    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when no passwords are provided', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(getByText('register.errors.repeatPassword.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when only first password is provided', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "estudiante1")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(getByText('register.errors.repeatPassword.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when only second password is provided', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput2, "estudiante1")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.requiredLength')).toThrow()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(getByText('register.errors.repeatPassword.passwordsMismatch')).toBeInTheDocument()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when password is too short', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "admin")
        userEvent.type(passInput2, "admin")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
    expect(() => getByText('register.errors.email.isRequired')).toThrow()
    expect(() => getByText('register.errors.email.invalidEmail')).toThrow()
    expect(() => getByText('register.errors.email.maxLength')).toThrow()
    expect(() => getByText('register.errors.password.isRequired')).toThrow()
    expect(getByText('register.errors.password.requiredLength')).toBeInTheDocument()
    expect(() => getByText('register.errors.password.maxLength')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.isRequired')).toThrow()
    expect(() => getByText('register.errors.repeatPassword.passwordsMismatch')).toThrow()
    expect(() => getByText('register.errors.school.programNotSelected')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Form displays error when password is too long', async () => {
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "imbluedabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadye")
        userEvent.type(passInput2, "imbluedabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadyedabadeedabadyeDabadeedabadye")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
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
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante2")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await selectEvent.select(getByLabelText('program-select'), 'S10 - Ingeniería Informática')
    await act(async() => {
        userEvent.click(submitButton)
    })
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
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante1")
    })
    await act(async() => {
        userEvent.click(submitButton)
    })
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
    const {asFragment, getByLabelText, getByText} = render(<Router><SignUpStudentForm/></Router>)
    const emailInput = await screen.getByPlaceholderText("register.placeholders.emailStudent")
    const passInput1 = await screen.getByPlaceholderText("register.placeholders.password")
    const passInput2 = await screen.getByPlaceholderText("register.placeholders.repeatPassword")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput1, "estudiante1")
        userEvent.type(passInput2, "estudiante1")
    })
    await selectEvent.select(getByLabelText('school-select'), 'Instituto Tecnológico de Buenos Aires')
    await act(async() => {
        userEvent.click(submitButton)
    })
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
