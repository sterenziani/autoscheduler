import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../components/FormInputField';
import { OK, CREATED } from '../services/ApiConstants';
import { DAYS, DEFAULT_DATE } from "../services/SystemConstants";
import NoAccess from '../components/NoAccess';
import Roles from '../resources/RoleConstants';

function EditCourseClassPage(props) {
    const CourseClassSchema = Yup.object().shape({
        className: Yup.string()
            .min(1, 'forms.errors.courseClass.minLength')
            .max(25, 'forms.errors.courseClass.maxLength')
            .required('forms.errors.courseClass.isRequired'),
    });

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams()
    const user = ApiService.getActiveUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [courseClass, setCourseClass] = useState(null);
    const [courses, setCourses] = useState();
    const [terms, setTerms] = useState();
    const [buildings, setBuildings] = useState();

    const [selectedCourse, setSelectedCourse] = useState();
    const [selectedTerm, setSelectedTerm] = useState();
    const [className, setClassName] = useState();
    const [lectures, setLectures] = useState([]);

    const [selectionError, setSelectionError] = useState();
    const [badConnection, setBadConnection] = useState();

    useEffect(() => {
        if(!user)
            navigate("/login")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        async function execute() {
            if(id){
                if(user && !courseClass)
                    await Promise.all([loadCourseClass()]);
                if(user && courseClass){
                    if(!courses && !terms && !buildings)
                        await Promise.all([loadCourses(user.id), loadTerms(user.id)], loadBuildings(user.id));
                    else if (courses && terms && buildings)
                        setLoading(false)
                }
            }
            else{
                if(user){
                    if(!courses && !terms && !buildings)
                        await Promise.all([loadCourses(user.id), loadTerms(user.id)], loadBuildings(user.id));
                    else if (courses && terms && buildings){
                        setSelectedCourse(courses[0].id)
                        setSelectedTerm(terms[0].id)
                        setClassName("X")
                        setLectures([DEFAULT_DATE])
                        setLoading(false)
                    }
                }
            }
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[courseClass, courses, terms, buildings])

    const loadCourseClass = async () => {
        ApiService.getCourseClass(id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
              setCourseClass(data)
              setSelectedCourse(data.course)
              setSelectedTerm(data.term)
              setClassName(data.courseClass)
              setLectures(data.lectures)
            }
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

    const loadTerms = async (universityId) => {
        ApiService.getTerms(universityId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else
              setTerms(data)
        });
    }

    const loadBuildings = async (universityId) => {
        ApiService.getBuildings(universityId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else
              setBuildings(data)
        });
    }

    const onChangeCourse = (e) => {
        setSelectedCourse(e.target.value)
    }

    const onChangeTerm = (e) => {
        setSelectedTerm(e.target.value)
    }

    const onChangeDay = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy[index].day = e.target.value;
        setLectures(lecturesCopy)
    }

    const onChangeStartTime = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy[index].startTime = e.target.value;
        setLectures(lecturesCopy)
    }

    const onChangeEndTime = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy[index].endTime = e.target.value;
        setLectures(lecturesCopy)
    }

    const onChangeBuilding = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy[index].building = e.target.value;
        setLectures(lecturesCopy)
    }

    const onClickTrashCan = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy.splice(index, 1);
        setLectures(lecturesCopy)
    }

    const onClickPlusSign = (e) => {
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy.push(JSON.parse(JSON.stringify(DEFAULT_DATE))); // Clone DEFAULT_DATE
        setLectures(lecturesCopy)
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (selectedCourse && selectedTerm && values.className)
        {
            const resp = await ApiService.saveCourseClass(id, selectedCourse, selectedTerm, values.className, lectures)
            if(resp.status === OK || resp.status === CREATED)
                navigate("/courses/"+selectedCourse);
            else{
                setError(true)
                setStatus(resp.status)
                setSubmitting(false);
            }
        }
        else {
            setSelectionError(true);
            setSubmitting(false);
        }
    };

    if(user.type !== Roles.UNIVERSITY)
        return <NoAccess/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editClass':'forms.createClass')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editClass':'forms.createClass')}</h2>
                <Formik initialValues={{ className: className }} validationSchema={CourseClassSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <Form.Group controlId="course" className="row mx-auto form-row">
                        <div className="col-3 text-end my-auto text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.course')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 text-center">
                        {
                            <Form.Select value={selectedCourse} onChange={onChangeCourse}>
                                {courses && courses.map((c) => (
                                    <option key={c.id} value={c.id}> {c.internalId + ' - ' + c.name}</option>
                                ))}
                            </Form.Select>
                        }
                        </div>
                    </Form.Group>
                    <Form.Group controlId="term" className="row mx-auto form-row">
                        <div className="col-3 text-end my-auto text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.term')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 text-center">
                        {
                            <Form.Select value={selectedTerm} onChange={onChangeTerm}>
                                {terms && terms.map((c) => (
                                    <option key={c.id} value={c.id}> {c.internalId + ' - ' + c.name}</option>
                                ))}
                            </Form.Select>
                        }
                        </div>
                    </Form.Group>
                    <FormInputField
                        label="forms.className" name="className"
                        placeholder="forms.placeholders.className"
                        value={values.className} error={errors.className}
                        touched={touched.className} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Form.Group controlId="schedule" className="row mx-auto form-row">
                        <div className="col-3 text-end my-3 text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.lectures')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 align-items-start align-items-center">
                            {lectures.map((entry, index) => (
                                <Row key={'timerow-' + index} xs={1} md={6} className="list-row pb-2 pt-3 justify-content-center">
                                    <Form.Select id={'day-' + index} className="w-auto mx-1" value={lectures[index].day} onChange={onChangeDay}>
                                        {DAYS.map((p) => (<option key={p} value={p}>{t('days.' + p)}</option>))}
                                    </Form.Select>
                                    <input
                                        type="time" id={'start-' + index} className="w-auto timepicker"
                                        value={lectures[index].startTime}
                                        onChange={onChangeStartTime}
                                    />
                                    <h5 className="my-auto w-auto"><strong>-</strong></h5>
                                    <input
                                        type="time" id={'end-' + index} className="w-auto timepicker"
                                        value={lectures[index].endTime}
                                        onChange={onChangeEndTime}
                                    />
                                    <Form.Select id={'building-' + index} className="w-auto mx-1" value={lectures[index].building} onChange={onChangeBuilding}>
                                        {buildings.map((b) => (<option key={b.id} value={b.id}>{b.internalId}</option>))}
                                    </Form.Select>
                                    <i className="bi bi-trash-fill btn color-primary w-auto my-auto mx-2"
                                        id={'trash-' + index} onClick={onClickTrashCan}
                                    ></i>
                                </Row>
                            ))}
                            <div className="mx-auto align-items-center plus-button-container clickable">
                                <i className="me-3 bi bi-plus-circle-fill btn btn-lg color-primary" onClick={onClickPlusSign}></i>
                            </div>
                        </div>
                    </Form.Group>
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditCourseClassPage;