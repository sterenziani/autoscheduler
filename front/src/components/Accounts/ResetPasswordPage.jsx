import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from "react-router-dom";
import ApiService from '../../services/ApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecycle } from '@fortawesome/free-solid-svg-icons';
import FormInputField from '../Common/FormInputField';
import { OK, BAD_REQUEST, TIMEOUT, FORBIDDEN } from '../../services/ApiConstants';
import { Form, Button, Spinner } from 'react-bootstrap';
import Roles from '../../resources/RoleConstants';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ChangePasswordSchema = Yup.object().shape({
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
                test: (repeat_password) => !!password && repeat_password == password,
                message: 'register.errors.repeatPassword.passwordsMismatch',
            });
        })
        .required('register.errors.repeatPassword.isRequired'),
});

function ResetPasswordPage(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const {token} = useParams()
    const [user, setUser] = useState(false)
    const [invalidToken, setInvalidToken] = useState(false)

    const [badConnection, setBadConnection] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if(!token){
            setInvalidToken(true)
            setLoading(false)
        }
        ApiService.getPasswordChangeToken(token).then((resp) => {
            if (resp && resp.status && resp.status !== OK)
                setInvalidToken(true)
            else
                setUser(resp.data)
            setLoading(false)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const changePassword = async (values, setSubmitting, setFieldError) => {
        const resp = await ApiService.changePassword(user.id, token, values.password)
        switch (resp.status) {
            case OK:
                authenticate(values)
                break;
            default:
                setSubmitting(false)
                setError(resp.status)
                break;
        }
    }

    const authenticate = async (values) => {
        const { status } = await ApiService.login(values.email, values.password);
        switch (status) {
            case OK:
                navigate("/")
                break;
            default:
                navigate("/login")
                break;
        }
    }

    const onSubmit = (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true)
        values.email = user.email
        changePassword(values, setSubmitting, setFieldError)
    };

    if (loading === true) {
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }
    if(invalidToken)
        return(<React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t('changePassword.title')}</title></Helmet>
            </HelmetProvider>
            <div className="container my-5 bg-primary rounded p-3 mx-auto text-center color-white">
                <FontAwesomeIcon size="3x" icon={faRecycle} />
                <h4>{t('changePassword.title')}</h4>
                <p>{t('changePassword.notFound')}</p>
            </div>
            </React.Fragment>
        )
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t('changePassword.title')}</title></Helmet>
            </HelmetProvider>
            <div className="container my-5 bg-primary rounded">
                {error && (<p className="form-error">{t('register.errors.codes.'+error)}</p>)}
                <Formik
                    initialValues={{ password: '', repeat_password: '' }}
                    validationSchema={ChangePasswordSchema} onSubmit={onSubmit}
                >
                    {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                        <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                            <FontAwesomeIcon size="3x" icon={faRecycle} />
                            <h4>{t('changePassword.title')}</h4>
                            <p className="mb-3">{t('changePassword.forUser', { email: user.email })}</p>
                            {badConnection && (<p className="form-error">{t('register.errors.badConnection')}</p>)}
                            <input id="browser-warning-fix" type="text" autoComplete="username" ng-hide="true" className="invisible"></input>

                            <FormInputField
                                id="new-password"
                                type="password"
                                label="register.password"
                                name="password"
                                autoComplete="new-password"
                                placeholder="register.placeholders.password"
                                value={values.password}
                                error={errors.password}
                                touched={touched.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />

                            <FormInputField
                                id="new-password-repeat"
                                type="password"
                                label="register.repeatPassword"
                                name="repeat_password"
                                autoComplete="new-password"
                                placeholder="register.placeholders.password"
                                value={values.repeat_password}
                                error={errors.repeat_password}
                                touched={touched.repeat_password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <Button variant="secondary" type="submit" disabled={errors.password || errors['repeat_password'] || isSubmitting}>
                                {t('changePassword.submit')}
                            </Button>
                        </Form>
                    )}
                </Formik>
            </div>
        </React.Fragment>
    );
}

export default ResetPasswordPage;
