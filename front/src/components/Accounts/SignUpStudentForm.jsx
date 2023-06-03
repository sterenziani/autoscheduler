import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMortarBoard } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ApiService from '../../services/ApiService';
import { OK, CREATED, BAD_REQUEST } from '../../services/ApiConstants';
import FormInputField from '../Common/FormInputField';
import AsyncSelect from 'react-select/async'

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
                test: (repeat_password) => !!password && repeat_password == password,
                message: 'register.errors.repeatPassword.passwordsMismatch',
            });
        })
        .required('register.errors.repeatPassword.isRequired'),
});

function SignUpStudentForm(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const [selectedSchool, setSelectedSchool] = useState()
    const [selectedProgram, setSelectedProgram] = useState()
    const [error, setError] = useState(null)
    const [status, setStatus] = useState(false)
    const [programError, setProgramError] = useState(false)

    const onChangeSchools = (schoolId) => {
        setSelectedSchool(schoolId)
        setSelectedProgram()
    }

    const onChangePrograms = (programId) => {
        setSelectedProgram(programId)
    }

    const register = async (values, setSubmitting, setFieldError) => {
        const { status, data } = await ApiService.registerStudent(
            values.email, values.password, selectedSchool, selectedProgram
        );
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
    }

    const authenticate = async (values) => {
        const { status, data } = await ApiService.login(values.email, values.password)
        switch (status) {
            case OK:
                navigate("/")
                break
            default:
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

    const loadSchoolOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getUniversities(inputValue).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK)
                    findError = data.status;
                if (findError) {
                    setError(data.status)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(data)
                }
            })
        })
    }

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getPrograms(selectedSchool, inputValue).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK)
                    findError = data.status;
                if (findError) {
                    setError(data.status)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(data)
                }
            })
        })
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
                    {error && (<p className="form-error">{t('register.errors.codes.'+error)}</p>)}

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
                        placeholder="register.placeholders.repeatPassword"
                        value={values.repeat_password}
                        error={errors.repeat_password}
                        touched={touched.repeat_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    {!error && (
                        <>
                            <Form.Group controlId="school" className="mb-0 row mx-auto form-row">
                                <div className="col-3 text-end my-auto text-break ">
                                    <Form.Label className="my-0">
                                        <h5 className="my-0">
                                            <strong> {t('register.school')}</strong>
                                        </h5>
                                    </Form.Label>
                                </div>
                                <div className="col-9 text-center">
                                    <AsyncSelect
                                        aria-label="school-select"
                                        className="text-black text-start"
                                        placeholder={t('register.school')}
                                        cacheOptions
                                        defaultOptions
                                        getOptionLabel={e => e.name}
                                        getOptionValue={e => e.id}
                                        loadOptions={loadSchoolOptions}
                                        onChange={opt => onChangeSchools(opt.id)}
                                    />
                                </div>
                            </Form.Group>
                            {
                                selectedSchool && (
                                <Form.Group controlId="program" className="mb-0 row mx-auto form-row">
                                    <div className="col-3 text-end my-auto text-break">
                                        <Form.Label className="my-0">
                                            <h5 className="my-0">
                                                <strong>{t('register.program')}</strong>
                                            </h5>
                                        </Form.Label>
                                    </div>
                                    <div className="col-9 text-center">
                                        <AsyncSelect key={selectedSchool}
                                            aria-label="program-select"
                                            className="text-black text-start"
                                            placeholder={t('register.program')}
                                            cacheOptions
                                            defaultOptions
                                            getOptionLabel={e => e.internalId+' - '+e.name}
                                            getOptionValue={e => e.id}
                                            loadOptions={loadProgramOptions}
                                            onChange={opt => onChangePrograms(opt.id)}
                                        />
                                    </div>
                                </Form.Group>
                            )}
                            {!selectedProgram && programError && (
                                <div className="my-0 row mx-auto form-row">
                                    <div className="col-3 text-center"></div>
                                    <div className="col-9 text-center">
                                        <p key="program-error" className="form-error text-start my-0">
                                            {t('register.errors.school.programNotSelected')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <Button className="mt-4 mb-2" variant="secondary" type="submit" aria-label="submit-button" disabled={isSubmitting || error}>
                        {t('register.submit')}
                    </Button>
                </Form>
            )}
        </Formik>
    )
}

export default SignUpStudentForm;
