import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event';
import { Link, BrowserRouter as Router } from 'react-router-dom';
import SignInForm from '../components/Accounts/SignInForm';
import * as api from '../services/ApiService'

jest.mock("../services/ApiService", () => {
  return {
    login: jest.fn()
  };
});

beforeEach(() => {
    api.login.mockResolvedValue({
        status: 200
    })
})

test('Empty fields give double error', async () => {
    render(<Router><SignInForm/></Router>)
    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText(/password/i)
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.click(submitButton)
    })
    const emailError = screen.getByText('register.errors.email.isRequired')
    const passError = screen.getByText('register.errors.password.isRequired')
    expect(emailError).toBeInTheDocument()
    expect(passError).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
})

test('Empty email field gives email error', async () => {
    render(<Router><SignInForm/></Router>)
    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText(/password/i)
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(passInput, "estudiante1")
        userEvent.click(submitButton)
    })
    const emailError = screen.getByText('register.errors.email.isRequired')
    expect(emailError).toBeInTheDocument()
    expect(() => screen.getByText('register.errors.password.isRequired')).toThrow()
    expect(submitButton).toBeEnabled()
})

test('Empty password field gives password error', async () => {
    render(<Router><SignInForm/></Router>)
    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText(/password/i)
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.click(submitButton)
    })
    const passError = screen.getByText('register.errors.password.isRequired')
    expect(() => screen.getByText('register.errors.email.isRequired')).toThrow()
    expect(passError).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
})

test('Button is disabled while submitting', async () => {
    render(<Router><SignInForm/></Router>)
    const emailInput = await screen.getByPlaceholderText(/email/i)
    const passInput = await screen.getByPlaceholderText(/password/i)
    const submitButton = await screen.getByRole('button', {name:'submit-button'})

    await act(async() => {
        userEvent.type(emailInput, "estudiante1@itba.edu.ar")
        userEvent.type(passInput, "estudiante2")
        userEvent.click(submitButton)
    })
    expect(submitButton).toBeDisabled()
})
