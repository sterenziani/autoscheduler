import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Row, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMortarBoard } from '@fortawesome/free-solid-svg-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../resources/ApiConstants';
import FormInputField from '../Common/FormInputField';
import FormInputLabel from '../Common/FormInputLabel';
import FormAsyncSelect from '../Common/FormAsyncSelect';

const SignUpSchema = Yup.object().shape({
    name: Yup.string()
        .max(50, 'register.errors.studentName.maxLength')
        .required('register.errors.studentName.isRequired'),
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
});

const EXISTING_USER_ERROR = "USER_ALREADY_EXISTS"

function SignUpStudentForm(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const [selectedSchool, setSelectedSchool] = useState()
    const [selectedProgram, setSelectedProgram] = useState()
    const [error, setError] = useState()
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
            values.name, values.email, values.password, selectedSchool, selectedProgram
        );
        switch (status) {
            case CREATED:
                authenticate(values)
                break;
            default:
                setSubmitting(false)
                setError(data?.code?? status)
                break;
        }
    }

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
    }

    const onSubmit = (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true)
        if (selectedSchool && selectedProgram)
            register(values, setSubmitting, setFieldError)
        else {
            setProgramError(true)
            setSubmitting(false)
        }
    }

    const loadSchoolOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getUniversities(inputValue).then(resp => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError) {
                    setError(resp.status)
                    callback([])
                } else {
                    callback(resp.data)
                }
            })
        })
    }

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getProgramsOfUniversity(selectedSchool, inputValue).then(resp => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError) {
                    setError(resp.status)
                    callback([])
                } else {
                    callback(resp.data)
                }
            })
        })
    }

    return (
        <Formik
            initialValues={{ name: '', email: '', password: '', repeat_password: '' }}
            validationSchema={SignUpSchema}
            onSubmit={onSubmit}
        >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                    <FontAwesomeIcon size="3x" icon={faMortarBoard} />
                    {error && (<p className="form-error">{t('register.errors.codes.'+error)}</p>)}

                    <FormInputField
                        label="register.name"
                        name="name"
                        id="student-name"
                        placeholder="register.placeholders.nameStudent"
                        autoComplete="name"
                        value={values.name}
                        error={errors.name}
                        touched={touched.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    <FormInputField
                        label="register.email"
                        name="email"
                        id="student-email"
                        placeholder="register.placeholders.emailStudent"
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
                        id="student-password"
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
                        id="student-repeat-pass"
                        placeholder="register.placeholders.repeatPassword"
                        autoComplete="new-password"
                        value={values.repeat_password}
                        error={errors.repeat_password}
                        touched={touched.repeat_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    {!(error && error !== EXISTING_USER_ERROR) && (
                        <>
                            <Row className='mx-auto form-row text-center'>
                                <FormInputLabel label="register.school"/>
                                <div className="col-md-9" data-testid="school-select">
                                    <FormAsyncSelect
                                        id="input-university"
                                        aria-label="school-select"
                                        className="text-black text-start"
                                        placeholder={t('register.school')}
                                        cacheOptions
                                        defaultOptions
                                        getOptionLabel={e => e.name}
                                        getOptionValue={e => e.id}
                                        noOptionsMessage={() => t('selectNoResults')}
                                        loadOptions={loadSchoolOptions}
                                        onChange={opt => onChangeSchools(opt.id)}
                                    />
                                </div>
                            </Row>

                            {
                                selectedSchool && (
                                <Row className='mx-auto form-row text-center'>
                                    <FormInputLabel label="register.program"/>
                                    <div className="col-md-9" data-testid="program-select">
                                        <FormAsyncSelect key={selectedSchool}
                                            aria-label="program-select"
                                            className="text-black text-start"
                                            placeholder={t('register.program')}
                                            cacheOptions
                                            defaultOptions
                                            getOptionLabel={e => e.internalId+' - '+e.name}
                                            getOptionValue={e => e.id}
                                            noOptionsMessage={() => t('selectNoResults')}
                                            loadOptions={loadProgramOptions}
                                            onChange={opt => onChangePrograms(opt.id)}
                                        />
                                    </div>
                                </Row>
                            )}
                            {!selectedProgram && programError && (
                                <Row className="my-0 mx-auto form-row">
                                    <div className="col-3 text-center"></div>
                                    <div className="col-9 text-center">
                                        <p key="program-error" className="form-error text-start my-0">
                                            {t('register.errors.school.programNotSelected')}
                                        </p>
                                    </div>
                                </Row>
                            )}
                        </>
                    )}
                    <Button className="mt-4 mb-2" variant="secondary" type="submit" aria-label="submit-button" disabled={isSubmitting || (error && error !== EXISTING_USER_ERROR)}>
                        {t('register.submit')}
                    </Button>
                </Form>
            )}
        </Formik>
    )
}

export default SignUpStudentForm;
