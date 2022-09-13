import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../components/FormInputField';
import CourseListForm from '../components/Lists/CourseListForm';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import { DAYS, DEFAULT_DATE } from "../services/SystemConstants";

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
    });

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams()
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [programError, setProgramError] = useState();
    const [badConnection, setBadConnection] = useState();

    const [program, setProgram] = useState(null);
    const [mandatoryCourses, setMandatoryCourses] = useState([]);
    const [optionalCourses, setOptionalCourses] = useState([]);

    const [courses, setCourses] = useState(null);
    const [availableCourses, setAvailableCourses] = useState();

    // ComponentDidMount
    useEffect( () => {
        async function execute() {
            if(!user)
                await Promise.all([loadUser()]);
            if(id){
                if(user && !program && !courses)
                    await Promise.all([loadProgram(), loadCourses(user.id)]);
                else if(user && program && courses)
                    await Promise.all([loadMandatoryCourses(program.id), loadOptionalCourses(program.id)]);
            }
            else{
                if(user && !courses)
                    await Promise.all([loadCourses(user.id)]);
                else if(user && !program && courses)
                    setProgram({"name": t("forms.placeholders.programName"), "internalId": t("forms.placeholders.programCode")})
            }
            if(user && program && courses && mandatoryCourses && optionalCourses){
                setAvailableCourses(getFilteredCourses([...mandatoryCourses, ...optionalCourses]))
                setLoading(false)
            }
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[user, program, courses])

    useEffect( () => {
        setAvailableCourses(getFilteredCourses([...mandatoryCourses, ...optionalCourses]))
    },[mandatoryCourses, optionalCourses])

    const loadUser = async () => {
        ApiService.getActiveUser().then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else
                setUser(data)
        })
    }

    const loadProgram = async () => {
        ApiService.getProgram(id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else
              setProgram(data)
        });
    }

    const loadCourses = async (universityId) => {
        ApiService.getCourses(universityId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setCourses(data)
            }
        });
    }

    const loadMandatoryCourses = async (programId) => {
        ApiService.getMandatoryCourses(programId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setMandatoryCourses(data)
            }
        });
    }

    const loadOptionalCourses = async (programId) => {
        ApiService.getOptionalCourses(programId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setOptionalCourses(data)
            }
        });
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (values.programCode && values.programName)
        {
            const resp = await ApiService.saveCourse(id, values.programCode, values.programName, mandatoryCourses, optionalCourses)
            if(resp.status == OK || resp.status == CREATED){
                navigate("/?tab=programs")
            }
            else{
                setError(true)
                setStatus(resp.status)
                setSubmitting(false);
            }
        }
        else {
            setProgramError(true);
            setSubmitting(false);
        }
    };

    const getFilteredCourses = (coursesToRemove) => {
        let availableCourses = []
        if(courses)
        {
            availableCourses = courses.filter(function(item) {
                const match = coursesToRemove.find((c) => c.id === item.id);
                return !match;
            })
        }
        return availableCourses
    }

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

    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editProgram':'forms.createProgram')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editProgram':'forms.createProgram')}</h2>
                <Formik initialValues={{ programName: program.name, programCode: program.internalId }} validationSchema={ProgramSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <FormInputField
                        label="forms.programCode" name="programCode"
                        placeholder="forms.placeholders.programCode"
                        value={values.programCode} error={errors.programCode}
                        touched={touched.programCode} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        label="forms.programName" name="programName"
                        placeholder="forms.placeholders.programName"
                        value={values.programName} error={errors.programName}
                        touched={touched.programName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Row>
                    <Col>
                        <Form.Group controlId="required-courses" className="row mx-auto form-row">
                            <div className="text-center my-3 text-break">
                                <Form.Label className="my-0">
                                    <h5 className="my-0"><strong>{t('forms.mandatoryCourses')}</strong></h5>
                                </Form.Label>
                            </div>
                            <div className="align-items-start align-items-center">
                                <CourseListForm courses={courses}
                                    listedCourses={mandatoryCourses} availableCourses={availableCourses}
                                    onClickTrashCan={onClickReqTrashCan} addCourse={addRequiredCourse}
                                />
                            </div>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="required-courses" className="row mx-auto form-row">
                            <div className="text-center my-3 text-break">
                                <Form.Label className="my-0">
                                    <h5 className="my-0"><strong>{t('forms.optionalCourses')}</strong></h5>
                                </Form.Label>
                            </div>
                            <div className="align-items-start align-items-center">
                                <CourseListForm courses={courses}
                                    listedCourses={optionalCourses} availableCourses={availableCourses}
                                    onClickTrashCan={onClickOptTrashCan} addCourse={addOptionalCourse}
                                />
                            </div>
                        </Form.Group>
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
