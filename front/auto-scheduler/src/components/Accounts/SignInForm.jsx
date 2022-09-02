import React, { Component } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Translation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';

import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT, CONFLICT, UNAUTHORIZED } from '../../services/ApiConstants';
import FormInputField from '../FormInputField';
import SignInRecoverPasswordForm from './SignInRecoverPasswordForm';

const SignInSchema = Yup.object().shape({
    email: Yup.string().required('register.errors.email.isRequired'),
    password: Yup.string().required('register.errors.password.isRequired'),
});

class SignInForm extends Component {
    state = {
        correct: true,
        bad_connection: false,
        failed_external_login: this.props.loginFailed,
        showPasswordModal: false,
    };

    authenticate = async (values, setSubmitting) => {
        const { status } = await ApiService.login(values.email, values.password);
        console.log("Status: " +status)
        switch (status) {
            case OK:
                console.log('Redirect');
                break;
            case UNAUTHORIZED:
                setSubmitting(false);
                this.setState({ correct: false });
                break;
            default:
                setSubmitting(false);
                this.setState({ bad_connection: true });
                break;
        }
    };

    onSubmit = (values, { setSubmitting }) => {
        console.log('Logging in');
        if (this.state.failed_external_login) {
            this.props.loginFailedProcessed();
            this.setState({ failed_external_login: false });
        }
        setSubmitting(true);
        this.authenticate(values, setSubmitting);
    };

    render() {
        return (
            <React.Fragment>
                <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={SignInSchema}
                    onSubmit={this.onSubmit}
                >
                    {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                        <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                            <FontAwesomeIcon size="3x" icon={faKey} />
                            {!this.state.correct && (
                                <p className="form-error">
                                    <Translation>{(t) => t('login.errors.loginFailed')}</Translation>
                                </p>
                            )}
                            {this.state.bad_connection && (
                                <p className="form-error">
                                    <Translation>{(t) => t('login.errors.badConnection')}</Translation>
                                </p>
                            )}
                            {this.state.failed_external_login && (
                                <p className="form-error">
                                    <Translation>{(t) => t('login.errors.externalLoginFailed')}</Translation>
                                </p>
                            )}
                            <FormInputField
                                label="register.email"
                                name="email"
                                placeholder="register.placeholders.emailUniversity"
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
                                placeholder="register.placeholders.password"
                                value={values.password}
                                error={errors.password}
                                touched={touched.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <Button variant="secondary" type="submit" disabled={isSubmitting}>
                                <Translation>{(t) => t('login.submit')}</Translation>
                            </Button>
                        </Form>
                    )}
                </Formik>
                <SignInRecoverPasswordForm />
            </React.Fragment>
        );
    }
}

export default SignInForm;
