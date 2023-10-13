import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';

import ApiService from '../../services/ApiService';
import { OK } from '../../services/ApiConstants';
import FormInputField from '../Common/FormInputField';
import SignInRecoverPasswordForm from './SignInRecoverPasswordForm';

const SignInSchema = Yup.object().shape({
    email: Yup.string().required('register.errors.email.isRequired'),
    password: Yup.string().required('register.errors.password.isRequired'),
});

function SignInForm(props) {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [error, setError] = useState()

    const authenticate = async (values, setSubmitting) => {
        const { status, data } = await ApiService.login(values.email, values.password);
        switch (status) {
            case OK:
                navigate("/")
                break;
            default:
                setSubmitting(false)
                setError(data?.code?? status)
                break;
        }
    }

    const onSubmit = (values, { setSubmitting }) => {
        setSubmitting(true)
        setError()
        authenticate(values, setSubmitting)
    };

    return (
        <React.Fragment>
            <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={SignInSchema}
                onSubmit={onSubmit}
            >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                    <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                        <FontAwesomeIcon size="3x" icon={faKey} />
                        {error && (<p className="form-error">{t('register.errors.codes.'+error)}</p>)}
                        <FormInputField
                            label="register.email"
                            name="email"
                            id="email-login"
                            placeholder="register.placeholders.emailUniversity"
                            autoComplete="email"
                            value={values.email}
                            error={errors.email}
                            touched={touched.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        <FormInputField
                            type="password"
                            label="register.password"
                            name="password"
                            id="login-password"
                            placeholder="register.placeholders.password"
                            autoComplete="current-password"
                            value={values.password}
                            error={errors.password}
                            touched={touched.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        <Button variant="secondary" type="submit" aria-label="submit-button" disabled={isSubmitting}>
                            {t('login.submit')}
                        </Button>
                    </Form>
                )}
            </Formik>
            <SignInRecoverPasswordForm />
        </React.Fragment>
    )
}

export default SignInForm;
