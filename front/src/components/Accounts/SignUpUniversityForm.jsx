import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingColumns } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ApiService from '../../services/ApiService';
import { OK, CREATED, BAD_REQUEST } from '../../services/ApiConstants';
import FormInputField from '../Common/FormInputField';

const CONTACT_EMAIL = process.env.REACT_APP_COMPANY_EMAIL;

const SignUpSchema = Yup.object().shape({
    email: Yup.string()
        .max(100, 'register.errors.email.maxLength')
        .email('register.errors.email.invalidEmail')
        .required('register.errors.email.isRequired'),
    password: Yup.string()
        .min(8, 'register.errors.password.requiredLength')
        .max(100, 'register.errors.password.maxLength')
        .matches(/^(?=.*[a-z])/, 'register.errors.password.requiredCharacters')
        .matches(/^(?=.*[A-Z])/, 'register.errors.password.requiredCharacters')
        .matches(/^(?=.*[0-9])/, 'register.errors.password.requiredCharacters')
        .required('register.errors.password.isRequired'),
    repeat_password: Yup.string()
        .when('password', (password, schema) => {
            return schema.test({
                test: (repeat_password) => !!password && repeat_password === password[0],
                message: 'register.errors.repeatPassword.passwordsMismatch',
            });
        })
        .required('register.errors.repeatPassword.isRequired'),
    name: Yup.string()
        .min(4, 'register.errors.name.requiredLength')
        .max(100, 'register.errors.name.maxLength')
        .required('register.errors.email.isRequired'),
});

function SignUpUniversityForm(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [error, setError] = useState(null)

    const register = async (values, setSubmitting, setFieldError) => {
        const { status, data } = await ApiService.registerUniversity(values.email, values.password, values.name);
        switch (status) {
            case CREATED:
                authenticate(values)
                break;
            case BAD_REQUEST:
                setSubmitting(false)
                setError(data.code)
                break;
            default:
                setSubmitting(false)
                setError("TIMEOUT")
                break;
        }
    };

    const authenticate = async (values) => {
        const { status } = await ApiService.login(values.email, values.password)
        switch (status) {
            case OK:
                navigate("/")
                break
            default:
                navigate("/login")
                break
        }
    };

    const onSubmit = (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        register(values, setSubmitting, setFieldError);
    };

    return (
        <Formik
            initialValues={{ email: '', password: '', repeat_password: '', name: '' }}
            validationSchema={SignUpSchema}
            onSubmit={onSubmit}
        >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                    <FontAwesomeIcon size="3x" icon={faBuildingColumns} />
                    {error && (<p className="form-error">{t('register.errors.codes.'+error)}</p>)}
                    <FormInputField
                        type="text"
                        label="register.name"
                        name="name"
                        id="university-name"
                        placeholder="register.placeholders.name"
                        autoComplete="organization"
                        value={values.name}
                        error={errors.name}
                        touched={touched.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    <FormInputField
                        label="register.email"
                        name="email"
                        id="university-email"
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
                        id="university-password"
                        placeholder="register.placeholders.password"
                        autoComplete="new-password"
                        value={values.password}
                        error={errors.password}
                        touched={touched.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    <FormInputField
                        type="password"
                        label="register.repeatPassword"
                        name="repeat_password"
                        id="university-repeat-pass"
                        placeholder="register.placeholders.password"
                        autoComplete="new-password"
                        value={values.repeat_password}
                        error={errors.repeat_password}
                        touched={touched.repeat_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    <p className="col-7 mx-auto">
                        {t('register.pleaseContact', { email: CONTACT_EMAIL })}
                    </p>

                    <Button variant="secondary" type="submit" disabled={isSubmitting}>
                        {t('register.submit')}
                    </Button>
                </Form>
            )}
        </Formik>
    )
}

export default SignUpUniversityForm;
