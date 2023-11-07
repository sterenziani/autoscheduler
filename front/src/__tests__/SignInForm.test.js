import React from 'react';
import * as router from 'react-router'
import { render, waitFor, queryByAttribute, fireEvent, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import { Link, BrowserRouter as Router } from 'react-router-dom';
import SignInForm from '../components/Accounts/SignInForm';
import * as api from '../services/ApiService'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key})
}));

jest.mock("../services/ApiService", () => {
  return {
    login: jest.fn()
  };
});

const navigate = jest.fn()
beforeEach(() => {
  jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate)
})

beforeEach(() => {
    api.login.mockImplementation((username, password) => {
        if(username === "estudiante1@itba.edu.ar" && password === "estudiante1"){
            return Promise.resolve({status: 200})
        }
        return Promise.resolve({status: 'INVALID_LOGIN'})
    })
})

test('Empty fields give double error', async () => {
    render(<Router><SignInForm/></Router>)
    const user = userEvent.setup()

    const submitButton = await screen.getByRole('button', {name:'submit-button'})
    user.click(submitButton)

    await waitFor(() => { expect(screen.getByText('register.errors.email.isRequired')).toBeInTheDocument() })
    expect(screen.getByText('register.errors.email.isRequired')).toBeInTheDocument()
    expect(screen.getByText('register.errors.password.isRequired')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
})

test('Empty email field gives email error', async () => {
    render(<Router><SignInForm/></Router>)
    const user = userEvent.setup()

    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText('register.placeholders.password')
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(passInput, { target: { value: 'estudiante1' } })
    user.click(submitButton)

    await waitFor(() => { expect(screen.getByText('register.errors.email.isRequired')).toBeInTheDocument() })
    const emailError = screen.getByText('register.errors.email.isRequired')
    expect(emailError).toBeInTheDocument()
    expect(() => screen.getByText('register.errors.password.isRequired')).toThrow()
    await waitFor(() => { expect(submitButton).toBeEnabled() })
})

test('Eye icon toggles password visibility', async () => {
    render(<Router><SignInForm/></Router>)
    const user = userEvent.setup()

    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText('register.placeholders.password')
    const eyeToggle = await screen.getByTestId("password-eye")
    const eyeToggleIcon = await screen.getByTestId("password-eye-icon")
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(passInput, { target: { value: 'estudiante1' } })

    expect(passInput.type).toBe('password')
    await user.click(eyeToggle)
    expect(passInput.type).toBe('text')
    await user.click(eyeToggle)
    expect(passInput.type).toBe('password')
})

test('Empty password field gives password error', async () => {
    render(<Router><SignInForm/></Router>)
    const user = userEvent.setup()

    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText('register.placeholders.password')
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    user.click(submitButton)

    await waitFor(() => { expect(screen.getByText('register.errors.password.isRequired')).toBeInTheDocument() })
    const passError = screen.getByText('register.errors.password.isRequired')
    expect(() => screen.getByText('register.errors.email.isRequired')).toThrow()
    expect(passError).toBeInTheDocument()
    await waitFor(() => { expect(submitButton).toBeEnabled() })
})

test('Sending an invalid user:pass shows error', async () => {
    render(<Router><SignInForm/></Router>)
    const user = userEvent.setup()

    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText('register.placeholders.password')
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput, { target: { value: 'estudiante2' } })
    user.click(submitButton)

    await waitFor(() => { expect(screen.getByText('register.errors.codes.INVALID_LOGIN')).toBeInTheDocument() })
})

test('Sending a valid user:pass disables submit button and redirects', async () => {
    render(<Router><SignInForm/></Router>)
    const user = userEvent.setup()

    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText('register.placeholders.password')
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    fireEvent.change(emailInput, { target: { value: 'estudiante1@itba.edu.ar' } })
    fireEvent.change(passInput, { target: { value: 'estudiante1' } })
    user.click(submitButton)

    await waitFor(() => { expect(submitButton).toBeDisabled() })
    expect(navigate).toHaveBeenCalledWith('/')
})
