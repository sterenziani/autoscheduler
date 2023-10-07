import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import CourseListForm from '../Lists/CourseListForm';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import Roles from '../../resources/RoleConstants';
import ErrorMessage from '../Common/ErrorMessage';

const EXISTING_PROGRAM_ERROR = "PROGRAM_ALREADY_EXISTS"

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

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams()
    const [user] = useState(ApiService.getActiveUser())
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);

    const [program, setProgram] = useState(null);
    const [mandatoryCourses, setMandatoryCourses] = useState();
    const [optionalCourses, setOptionalCourses] = useState();

    const [courses, setCourses] = useState(null);

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    useEffect( () => {
        const loadProgram = async () => {
            ApiService.getProgram(id).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else
                  setProgram(resp.data)
            });
        }

        const loadMandatoryCourses = async (programId) => {
            ApiService.getMandatoryCourses(programId).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else{
                    setMandatoryCourses(resp.data)
                }
            });
        }

        const loadOptionalCourses = async (programId) => {
            ApiService.getOptionalCourses(programId).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else{
                    setOptionalCourses(resp.data)
                }
            });
        }

        async function execute() {
            if(id){
                if(!program && !courses)
                    await Promise.all([loadProgram(), loadCourses(user.id)])
                else if(program && courses && !mandatoryCourses && !optionalCourses)
                    await Promise.all([loadMandatoryCourses(program.id), loadOptionalCourses(program.id)])
            }
            else{
                if(!courses)
                    await Promise.all([loadCourses(user.id)])
                else if(!program && !mandatoryCourses && !optionalCourses){
                    setMandatoryCourses([])
                    setOptionalCourses([])
                    setProgram({"name": t("forms.placeholders.programName"), "internalId": t("forms.placeholders.programCode"), "optionalCourseCredits": 0})
                }
            }

            if(program && courses && mandatoryCourses && optionalCourses)
                setLoading(false)
        }
        if(user) execute()
    },[program, courses, mandatoryCourses, optionalCourses, id, t, user])

    const loadCourses = async (universityId) => {
        ApiService.getCourses().then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setCourses(resp.data)
            }
        });
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (values.programCode && values.programName)
        {
            const mandatoryCourseIDs = mandatoryCourses.map(a => a.id)
            const optionalCourseIDs = optionalCourses.map(a => a.id)
            const resp = await ApiService.saveProgram(id, values.programName, values.programCode, mandatoryCourseIDs, optionalCourseIDs, values.programOptionalCredits)
            if(resp.status === OK || resp.status === CREATED){
                navigate("/?tab=programs")
            }
            else{
                setError(resp.data.code)
                setStatus(resp.status)
                setSubmitting(false);
            }
        }
        else {
            setSubmitting(false);
        }
    };

    const onClickReqTrashCan = (e) => {
        const mandatoriesCopy = Object.assign([], mandatoryCourses);
        mandatoriesCopy.splice(mandatoryCourses.indexOf(e), 1);
        setMandatoryCourses(mandatoriesCopy)
    }

    const onClickOptTrashCan = (e) => {
        const optionalsCopy = Object.assign([], optionalCourses);
        optionalsCopy.splice(optionalCourses.indexOf(e), 1);
        setOptionalCourses(optionalsCopy)
    }

    const addRequiredCourse = (courseToAdd) => {
        if(!courseToAdd)
            return;
        const mandatoriesCopy = Object.assign([], mandatoryCourses);
        mandatoriesCopy.push(courseToAdd);
        setMandatoryCourses(mandatoriesCopy)
    }

    const addOptionalCourse = (courseToAdd) => {
        if(!courseToAdd)
            return;
        const optionalsCopy = Object.assign([], optionalCourses);
        optionalsCopy.push(courseToAdd);
        setOptionalCourses(optionalsCopy)
    }

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.UNIVERSITY)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
        if (error && error !== EXISTING_PROGRAM_ERROR)
            return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editProgram':'forms.createProgram')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editProgram':'forms.createProgram')}</h2>
                {error && (<p className="form-error">{t('forms.errors.program.codeAlreadyTaken')}</p>)}
                <Formik initialValues={{ programName: program.name, programCode: program.internalId, programOptionalCredits: program.optionalCourseCredits }} validationSchema={ProgramSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
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
                        id="program-optional-credits"
                        label="forms.programOptionalCredits" name="programOptionalCredits"
                        placeholder="0"
                        value={values.programOptionalCredits} error={errors.programOptionalCredits}
                        touched={touched.programOptionalCredits} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Row>
                    <Col>
                        <Row className="mx-auto form-row">
                            <div className="text-center my-3 text-break">
                                <h5 className="my-0"><strong>{t('forms.mandatoryCourses')}</strong></h5>
                            </div>
                            <div className="align-items-start align-items-center">
                                <CourseListForm courses={courses}
                                    listedCourses={mandatoryCourses} unavailableCourses={[...optionalCourses, ...mandatoryCourses]}
                                    onClickTrashCan={onClickReqTrashCan} addCourse={addRequiredCourse}
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
                                <CourseListForm courses={courses}
                                    listedCourses={optionalCourses} unavailableCourses={[...optionalCourses, ...mandatoryCourses]}
                                    onClickTrashCan={onClickOptTrashCan} addCourse={addOptionalCourse}
                                />
                            </div>
                        </Row>
                    </Col>
                    </Row>
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditProgramPage;
