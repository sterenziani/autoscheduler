import React, { Component } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMortarBoard } from '@fortawesome/free-solid-svg-icons';
import { Translation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';

import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT, CONFLICT } from '../../services/ApiConstants';
import FormInputField from '../FormInputField';

const SignUpSchema = Yup.object().shape({
    email: Yup.string()
        .max(100, 'register.errors.email.maxLength')
        .email('register.errors.email.invalidEmail')
        .required('register.errors.email.isRequired'),
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

class SignUpStudentForm extends Component {
    state = {
        bad_connection: false,
        universities: [],
        programs: [],
        params: { school: undefined, program: undefined },
        loading: true,
        error: false,
        programError: false,
    };

    onChangeSchools(e) {
        let paramsCopy = Object.assign({}, this.state.params);
        paramsCopy.school = e.target.value;
        paramsCopy.program = undefined;
        this.setState({ params: paramsCopy, loading: true });
        this.loadPrograms(e.target.value);
    }

    onChangePrograms(e) {
        let paramsCopy = Object.assign({}, this.state.params);
        paramsCopy.program = e.target.value;
        this.setState({ params: paramsCopy });
    }

    loadUniversities() {
        ApiService.getUniversities().then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError) {
                this.setState({ loading: false, error: true, status: findError });
            } else {
                ApiService.getPrograms(data[0].id).then((dataProg) => {
                    let findError = null;
                    if (dataProg && dataProg.status && dataProg.status !== OK && dataProg.status !== CREATED)
                        findError = dataProg.status;
                    if (findError) this.setState({ loading: false, error: true, status: findError });
                    else {
                        let paramsCopy = Object.assign({}, this.state.params);
                        paramsCopy.school = data[0].id;
                        paramsCopy.program = dataProg && dataProg.length > 0 ? dataProg[0].id : undefined;
                        this.setState({
                            universities: data,
                            programs: dataProg,
                            params: paramsCopy,
                            loading: false,
                        });
                    }
                });
            }
        });
    }

    loadPrograms(university) {
        ApiService.getPrograms(university).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError) {
                this.setState({ loading: false, error: true, status: findError });
            } else {
                let paramsCopy = Object.assign({}, this.state.params);
                paramsCopy.program = data && data.length > 0 ? data[0].id : undefined;
                this.setState({ programs: data, params: paramsCopy, loading: false, programError: false });
            }
        });
    }

    componentDidMount() {
        this.loadUniversities();
    }

    register = async (values, setSubmitting, setFieldError) => {
        const { status, conflicts } = await ApiService.registerStudent(
            values.email,
            values.password,
            this.state.params.school,
            this.state.params.program
        );
        switch (status) {
            case CREATED:
                this.authenticate(values);
                break;
            case CONFLICT:
                setSubmitting(false);
                conflicts.forEach((conflict) => {
                    setFieldError(conflict.field, conflict.i18Key);
                });
                break;
            default:
                setSubmitting(false);
                this.setState({ bad_connection: true });
                break;
        }
    };

    authenticate = async (values) => {
        const { status } = await ApiService.login(values.username, values.password);
        switch (status) {
            case OK:
                console.log('Redirect');
                break;
            default:
                console.log('Log in failed');
                this.props.activateRedirect('login');
                break;
        }
    };

    onSubmit = (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (this.state.params.school && this.state.params.program) this.register(values, setSubmitting, setFieldError);
        else {
            this.setState({ programError: true });
            setSubmitting(false);
        }
    };

    render() {
        return (
            <Formik
                initialValues={{ email: '', password: '', repeat_password: '' }}
                validationSchema={SignUpSchema}
                onSubmit={this.onSubmit}
            >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                    <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                        <FontAwesomeIcon size="3x" icon={faMortarBoard} />
                        {this.state.bad_connection && (
                            <p className="form-error">
                                <Translation>{(t) => t('register.errors.badConnection')}</Translation>
                            </p>
                        )}

                        <FormInputField
                            label="register.email"
                            name="email"
                            placeholder="register.placeholders.emailStudent"
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

                        {this.state.loading ? (
                            <div className="mx-auto py-3">
                                <Spinner animation="border" />
                            </div>
                        ) : this.state.error ? (
                            <h1>ERROR {this.state.error}</h1>
                        ) : (
                            <>
                                <Form.Group controlId="school" className="row mx-auto form-row">
                                    <div className="col-3 text-end my-auto text-break ">
                                        <Form.Label className="my-0">
                                            <h5 className="my-0">
                                                <strong>
                                                    <Translation>{(t) => t('register.school')}</Translation>
                                                </strong>
                                            </h5>
                                        </Form.Label>
                                    </div>
                                    <div className="col-9 text-center">
                                        <Form.Select
                                            aria-label="School select"
                                            value={this.state.params.school}
                                            onChange={this.onChangeSchools.bind(this)}
                                        >
                                            {this.state.universities.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                </Form.Group>
                                <Form.Group controlId="program" className="row mx-auto form-row">
                                    <div className="col-3 text-end my-auto text-break">
                                        <Form.Label className="my-0">
                                            <h5 className="my-0">
                                                <strong>
                                                    <Translation>{(t) => t('register.program')}</Translation>
                                                </strong>
                                            </h5>
                                        </Form.Label>
                                    </div>
                                    <div className="col-9 text-center">
                                        <Form.Select
                                            aria-label="Program select"
                                            value={this.state.params.program}
                                            onChange={this.onChangePrograms.bind(this)}
                                        >
                                            {this.state.programs.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.internalId + ' - ' + p.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {!this.state.params.program && (
                                            <p key="program-error" className="form-error text-start my-0">
                                                <Translation>
                                                    {(t) => t('register.errors.school.programNotSelected')}
                                                </Translation>
                                            </p>
                                        )}
                                    </div>
                                </Form.Group>
                            </>
                        )}
                        <Button variant="secondary" type="submit" disabled={isSubmitting}>
                            <Translation>{(t) => t('register.submit')}</Translation>
                        </Button>
                    </Form>
                )}
            </Formik>
        );
    }
}

export default SignUpStudentForm;
