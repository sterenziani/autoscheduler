import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik, useFormikContext } from 'formik';
import LeavePagePrompt from '../Common/LeavePagePrompt'
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import CourseListForm from '../Lists/CourseListForm';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../resources/ApiConstants';
import Roles from '../../resources/RoleConstants';
import ErrorMessage from '../Common/ErrorMessage';
import LinkButton from '../Common/LinkButton';

const EXISTING_PROGRAM_ERROR = "PROGRAM_ALREADY_EXISTS"
const INVALID_NAME_ERROR = "INVALID_NAME"

function EditProgramPage(props) {
    const ProgramSchema = Yup.object().shape({
        programCode: Yup.string()
            .min(1, 'forms.errors.program.minCodeLength')
            .max(25, 'forms.errors.program.maxCodeLength')
            .required('forms.errors.program.codeIsRequired'),
        programName: Yup.string()
            .min(3, 'forms.errors.program.minNameLength')
            .max(50, 'forms.errors.program.maxNameLength')
            .required('forms.errors.program.nameIsRequired'),
        programOptionalCredits: Yup.number().min(0, 'forms.errors.program.positiveZeroOptionalCredits'),
    });

    const navigate = useNavigate()
    const {t} = useTranslation()
    const {id} = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const user = ApiService.getActiveUser()
    const [program, setProgram] = useState()
    const [areCoursesDefined, setAreCoursesDefined] = useState(false)
    const [mandatoryCourses, setMandatoryCourses] = useState()
    const [optionalCourses, setOptionalCourses] = useState()

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    useEffect( () => {
        const loadProgram = async () => {
            ApiService.getProgram(id).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else
                  setProgram(resp.data)
            });
        }

        const loadMandatoryCourses = async (programId) => {
            ApiService.getMandatoryCourses(programId, true).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else{
                    setMandatoryCourses(resp.data)
                }
            });
        }

        const loadOptionalCourses = async (programId) => {
            ApiService.getOptionalCourses(programId, true).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else{
                    setOptionalCourses(resp.data)
                }
            });
        }

        const checkIfCoursesDefined = async () => {
            ApiService.getCoursesPage(1, "").then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else{
                    setAreCoursesDefined(resp.data.length > 0)
                }
            });
        }

        async function execute() {
            if(id){
                if(!program)
                    await Promise.all([loadProgram()])
                else if(program && !mandatoryCourses && !optionalCourses)
                    await Promise.all([loadMandatoryCourses(program.id), loadOptionalCourses(program.id)])
            }
            else{
                if(!program && !mandatoryCourses && !optionalCourses){
                    setMandatoryCourses([])
                    setOptionalCourses([])
                    setProgram({"name": t("forms.placeholders.programName"), "internalId": t("forms.placeholders.programCode"), "optionalCourseCredits": 0})
                }
            }

            if(program && mandatoryCourses && optionalCourses){
                checkIfCoursesDefined().then(() => {
                    setLoading(false)
                })
            }
        }
        execute()
    },[program, mandatoryCourses, optionalCourses, id, t])

    const [modifiedCourses, setModifiedCourses] = useState(false)
    const [unsavedForm, setUnsavedForm] = useState(false)
    const FormObserver = () => {
        const { values } = useFormikContext()

        useEffect(() => {
            const internalIdChanged = (program && values.programCode !== program.internalId)
            const nameChanged = (program && values.programName !== program.name)
            const creditsChanged = (program && values.programOptionalCredits !== program.optionalCourseCredits)

            setUnsavedForm(internalIdChanged || nameChanged || creditsChanged || modifiedCourses)
        }, [values]);
        return null;
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (values.programCode && values.programName)
        {
            const mandatoryCourseIDs = mandatoryCourses.map(a => a.id)
            const optionalCourseIDs = optionalCourses.map(a => a.id)

            const creditRequirements = {}
            mandatoryCourses.forEach((c) => {if(c.requiredCredits > 0) creditRequirements[c.id] = c.requiredCredits})
            optionalCourses.forEach((c) => {if(c.requiredCredits > 0)  creditRequirements[c.id] = c.requiredCredits})

            const resp = await ApiService.saveProgram(id, values.programName, values.programCode, values.programOptionalCredits, mandatoryCourseIDs, optionalCourseIDs, creditRequirements)
            if(resp.status === OK || resp.status === CREATED){
                navigate("/?tab=programs")
            }
            else{
                setError(resp.data?.code?? resp.status)
                setSubmitting(false);
            }
        }
        else {
            setSubmitting(false);
        }
    };

    const onClickMandatoryTrashCan = (e) => {
        const mandatoriesCopy = Object.assign([], mandatoryCourses);
        mandatoriesCopy.splice(mandatoryCourses.indexOf(e), 1);
        setMandatoryCourses(mandatoriesCopy)
        setModifiedCourses(true)
    }

    const onClickOptTrashCan = (e) => {
        const optionalsCopy = Object.assign([], optionalCourses);
        optionalsCopy.splice(optionalCourses.indexOf(e), 1);
        setOptionalCourses(optionalsCopy)
        setModifiedCourses(true)
    }

    const addMandatoryCourse = (courseToAdd) => {
        if(!courseToAdd)
            return
        const mandatoriesCopy = Object.assign([], mandatoryCourses)
        mandatoriesCopy.push(courseToAdd)
        setMandatoryCourses(mandatoriesCopy)
        setModifiedCourses(true)
    }

    const addOptionalCourse = (courseToAdd) => {
        if(!courseToAdd)
            return
        const optionalsCopy = Object.assign([], optionalCourses)
        optionalsCopy.push(courseToAdd)
        setOptionalCourses(optionalsCopy)
        setModifiedCourses(true)
    }

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.UNIVERSITY)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error && error !== EXISTING_PROGRAM_ERROR && error !== INVALID_NAME_ERROR)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editProgram':'forms.createProgram')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editProgram':'forms.createProgram')}</h2>
                {error && error === EXISTING_PROGRAM_ERROR && (<p className="form-error">{t('forms.errors.program.codeAlreadyTaken')}</p>)}
                {error && error === INVALID_NAME_ERROR && (<p className="form-error">{t('forms.errors.invalidName')}</p>)}

                <Formik initialValues={{ programName: program.name, programCode: program.internalId, programOptionalCredits: program.optionalCourseCredits }} validationSchema={ProgramSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <LeavePagePrompt when={unsavedForm && !isSubmitting}/>
                    <FormObserver/>

                    <FormInputField
                        id="program-code"
                        label="forms.programCode" name="programCode"
                        placeholder="forms.placeholders.programCode"
                        value={values.programCode} error={errors.programCode}
                        touched={touched.programCode} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        id="program-name"
                        label="forms.programName" name="programName"
                        placeholder="forms.placeholders.programName"
                        value={values.programName} error={errors.programName}
                        touched={touched.programName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        tooltipMessage="forms.optionalCoursesTooltip"
                        id="program-optional-credits"
                        label="forms.programOptionalCredits" name="programOptionalCredits"
                        type="number" placeholder="0" min="0"
                        value={values.programOptionalCredits} error={errors.programOptionalCredits}
                        touched={touched.programOptionalCredits} onChange={handleChange} onBlur={handleBlur}
                    />
                    {
                        areCoursesDefined? [
                            <>
                            {
                                (mandatoryCourses.length + optionalCourses.length > 0) && <p>{t('forms.programRequirements')}</p>
                            }
                            <Row key="program-courses-block">
                                <Col>
                                    <Row className="mx-auto form-row">
                                        <div className="text-center my-3 text-break">
                                            <h5 className="my-0"><strong>{t('forms.mandatoryCourses')}</strong></h5>
                                        </div>
                                        <div className="align-items-start align-items-center">
                                        <CourseListForm editCreditRequirements
                                                listedCourses={mandatoryCourses} unavailableCourses={[...optionalCourses, ...mandatoryCourses]}
                                                onClickTrashCan={onClickMandatoryTrashCan} addCourse={addMandatoryCourse}
                                            />
                                        </div>
                                    </Row>
                                </Col>
                                <Col>
                                    <Row className="mx-auto form-row">
                                        <div className="text-center my-3 text-break">
                                            <h5 className="my-0"><strong>{t('forms.optionalCourses')}</strong></h5>
                                        </div>
                                        <div className="align-items-start align-items-center">
                                            <CourseListForm editCreditRequirements
                                                listedCourses={optionalCourses} unavailableCourses={[...optionalCourses, ...mandatoryCourses]}
                                                onClickTrashCan={onClickOptTrashCan} addCourse={addOptionalCourse}
                                            />
                                        </div>
                                    </Row>
                                </Col>
                            </Row>
                            </>
                        ] : [
                            <div key="program-no-courses-warning" className="mt-5 mb-3">
                                <p className="mb-0">{t('errors.noCoursesDefined')}</p>
                                <div className="text-center">
                                    <LinkButton variant="link" textKey="createCourse" href={'/courses/new'}/>
                                </div>
                            </div>
                        ]
                    }
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditProgramPage;
