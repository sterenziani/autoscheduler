import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';

import ApiService from '../../services/ApiService';
import { OK, BAD_REQUEST } from '../../services/ApiConstants';
import FormInputField from '../Common/FormInputField';
import SignInRecoverPasswordForm from './SignInRecoverPasswordForm';

const SignInSchema = Yup.object().shape({
    email: Yup.string().required('register.errors.email.isRequired'),
    password: Yup.string().required('register.errors.password.isRequired'),
});

function SignInForm(props) {
    const navigate = useNavigate();
    const { t } = useTranslation()

    const [correct, setCorrect] = useState(true);
    const [badConnection, setBadConnection] = useState(false);

    const authenticate = async (values, setSubmitting) => {
        const { status, code } = await ApiService.login(values.email, values.password);
        switch (status) {
            case OK:
                navigate("/")
                break;
            case BAD_REQUEST:
                setSubmitting(false)
                setCorrect(false)
                break;
            default:
                setSubmitting(false);
                setBadConnection(true)
                break;
        }
    }

    const onSubmit = (values, { setSubmitting }) => {
        setSubmitting(true)
        setCorrect(true)
        setBadConnection(false)
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
                        {!correct && (
                            <p className="form-error">{t('login.errors.loginFailed')}</p>
                        )}
                        {badConnection && (
                            <p className="form-error">{t('login.errors.badConnection')}</p>
                        )}
                        <FormInputField
                            label="register.email"
                            name="email"
                            id="email-login"
                            placeholder="register.placeholders.emailUniversity"
                            autoComplete="username"
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
