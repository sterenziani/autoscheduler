import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from "react-router-dom";
import ApiService from '../../services/ApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecycle } from '@fortawesome/free-solid-svg-icons';
import FormInputField from '../Common/FormInputField';
import { OK, CREATED, CONFLICT } from '../../services/ApiConstants';
import { Form, Button, Spinner } from 'react-bootstrap';
import Roles from '../../resources/RoleConstants';
import NoAccess from '../Common/NoAccess';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ChangePasswordSchema = Yup.object().shape({
    password: Yup.string()
        .min(6, 'register.errors.password.requiredLength')
        .max(100, 'register.errors.password.maxLength')
        .required('register.errors.password.isRequired'),
    repeat_password: Yup.string()
        .when('password', (password, schema) => {
            return schema.test({
                test: (repeat_password) => !!password && repeat_password === password,
                message: 'register.errors.repeatPassword.passwordsMismatch',
            });
        })
        .required('register.errors.repeatPassword.isRequired'),
});

function ResetPasswordPage(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const user = ApiService.getActiveUser()
    const {token} = useParams()
    const [resetToken, setResetToken] = useState(false)
    const [invalidToken, setInvalidToken] = useState(false)

    const [badConnection, setBadConnection] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if(!user)
            navigate("/login")
        if(!token){
            console.log("Invalid")
            setInvalidToken(true)
            setLoading(false)
        }
        ApiService.getToken(token).then((resp) => {
            if(resp.status !== OK)
                setInvalidToken(true)
            else
                setResetToken(resp.data)
            setLoading(false)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const changePassword = async (values, setSubmitting, setFieldError) => {
        const { status, conflicts } = await ApiService.changePassword(resetToken.user.id, resetToken.token, values.password)
        switch (status) {
            case CREATED:
                authenticate(values)
                break;
            case CONFLICT:
                setSubmitting(false);
                conflicts.forEach((conflict) => {
                    setFieldError(conflict.field, conflict.i18Key);
                });
                break;
            default:
                setSubmitting(false)
                setBadConnection(true)
                break;
        }
    }

    const authenticate = async (values) => {
        const { status } = await ApiService.login(resetToken.user.username, values.password);
        switch (status) {
            case OK:
                navigate("/")
                break
            default:
                console.log('Log in failed')
                navigate("/login")
                break
        }
    }

    const onSubmit = (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true)
        changePassword(values, setSubmitting, setFieldError)
    };

    if (loading === true) {
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }
    if(!user)
        return <React.Fragment/>
    if(user.type !== Roles.UNIVERSITY)
        return <NoAccess/>
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
                <Formik
                    initialValues={{ password: '', repeat_password: '' }}
                    validationSchema={ChangePasswordSchema} onSubmit={onSubmit}
                >
                    {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                        <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                            <FontAwesomeIcon size="3x" icon={faRecycle} />
                            <h4>{t('changePassword.title')}</h4>
                            <p className="mb-3">{t('changePassword.forUser', { email: resetToken.user.email })}</p>
                            {badConnection && (<p className="form-error">{t('register.errors.badConnection')}</p>)}

                            <FormInputField
                                type="password"
                                label="register.password"
                                name="password"
                                placeholder="register.placeholders.password"
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
                                placeholder="register.placeholders.password"
                                value={values.repeat_password}
                                error={errors.repeat_password}
                                touched={touched.repeat_password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <Button variant="secondary" type="submit" disabled={isSubmitting}>
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
