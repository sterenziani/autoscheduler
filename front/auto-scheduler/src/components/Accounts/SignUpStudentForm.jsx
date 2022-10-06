import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Button, Form, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMortarBoard } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ApiService from '../../services/ApiService';
import { OK, CREATED, CONFLICT } from '../../services/ApiConstants';
import FormInputField from '../FormInputField';
import Select from 'react-select'

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

function SignUpStudentForm(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()

    const [badConnection, setBadConnection] = useState(false);
    const [universities, setUniversities] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState()
    const [selectedProgram, setSelectedProgram] = useState()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [status, setStatus] = useState(false)
    const [programError, setProgramError] = useState(false)
    const [disablePrograms, setDisablePrograms] = useState(false)

    useEffect( () => {
        loadUniversities();
    }, [])

    const onChangeSchools = (schoolId) => {
        setSelectedSchool(schoolId)
        setSelectedProgram()
        setDisablePrograms(true)
        loadPrograms(schoolId)
    }

    const onChangePrograms = (programId) => {
        setSelectedProgram(programId)
    }

    const loadUniversities = () => {
        ApiService.getUniversities().then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError) {
                setLoading(false)
                setError(true)
                setStatus(findError)
            } else {
                setUniversities(data)
                setLoading(false)
            }
        })
    }

    const loadPrograms = (university) => {
        ApiService.getPrograms(university).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError) {
                setLoading(false)
                setError(true)
                setStatus(findError)
            } else {
                setPrograms(data)
                setLoading(false)
                setDisablePrograms(false)
                setProgramError(false)
            }
        });
    }

    const register = async (values, setSubmitting, setFieldError) => {
        const { status, conflicts } = await ApiService.registerStudent(
            values.email, values.password, selectedSchool, selectedProgram
        );
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
        const { status } = await ApiService.login(values.username, values.password);
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
        if (selectedSchool && selectedProgram)
            register(values, setSubmitting, setFieldError);
        else {
            setProgramError(true)
            setSubmitting(false)
        }
    }

    return (
        <Formik
            initialValues={{ email: '', password: '', repeat_password: '' }}
            validationSchema={SignUpSchema}
            onSubmit={onSubmit}
        >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                    <FontAwesomeIcon size="3x" icon={faMortarBoard} />
                    {badConnection && (
                        <p className="form-error">
                            {t('register.errors.badConnection')}
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

                    {loading ? (
                        <div className="mx-auto py-3"><Spinner animation="border"/></div>
                    ) : error ? (
                        <h1>ERROR {error}</h1>
                    ) : (
                        <>
                            <Form.Group controlId="school" className="row mx-auto form-row">
                                <div className="col-3 text-end my-auto text-break ">
                                    <Form.Label className="my-0">
                                        <h5 className="my-0">
                                            <strong> {t('register.school')}</strong>
                                        </h5>
                                    </Form.Label>
                                </div>
                                <div className="col-9 text-center">
                                    <Select
                                        className="text-black text-start"
                                        placeholder={t('register.school')}
                                        options={universities.map((u) => ({value: u.id, label: u.name}))}
                                        onChange={opt => onChangeSchools(opt.value)}
                                    />
                                </div>
                            </Form.Group>
                            {
                                !disablePrograms && selectedSchool && (
                                <Form.Group controlId="program" className="row mx-auto form-row">
                                    <div className="col-3 text-end my-auto text-break">
                                        <Form.Label className="my-0">
                                            <h5 className="my-0">
                                                <strong>{t('register.program')}</strong>
                                            </h5>
                                        </Form.Label>
                                    </div>
                                    <div className="col-9 text-center">
                                        <Select
                                            className="text-black text-start"
                                            placeholder={t('register.program')}
                                            options={programs.map((p) => ({value: p.id, label: p.internalId+' - '+p.name}))}
                                            onChange={opt => onChangePrograms(opt.value)}
                                        />
                                        {!selectedProgram && programError && (
                                            <p key="program-error" className="form-error text-start my-0">
                                                {t('register.errors.school.programNotSelected')}
                                            </p>
                                        )}
                                    </div>
                                </Form.Group>
                            )}
                        </>
                    )}
                    <Button variant="secondary" type="submit" disabled={isSubmitting}>
                        {t('register.submit')}
                    </Button>
                </Form>
            )}
        </Formik>
    )
}

export default SignUpStudentForm;
