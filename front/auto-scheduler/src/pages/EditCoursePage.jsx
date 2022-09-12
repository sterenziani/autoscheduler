import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Modal } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../components/FormInputField';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import { DAYS, DEFAULT_DATE } from "../services/SystemConstants";

function EditCoursePage(props) {
    const CourseSchema = Yup.object().shape({
        courseCode: Yup.string()
            .min(1, 'forms.errors.course.minCodeLength')
            .max(25, 'forms.errors.course.maxCodeLength')
            .required('forms.errors.course.codeIsRequired'),
        courseName: Yup.string()
            .min(3, 'forms.errors.course.minNameLength')
            .max(25, 'forms.errors.course.maxNameLength')
            .required('forms.errors.course.nameIsRequired'),
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

    const [course, setCourse] = useState(null);
    const [requirements, setRequirements] = useState([]);
    const [availableCourses, setAvailableCourses] = useState();

    const [courses, setCourses] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [courseToAdd,setCourseToAdd] = useState();

    // ComponentDidMount
    useEffect( () => {
        async function execute() {
            if(!user && !course)
                await Promise.all([loadUser()]);
            if(id){
                if(user && !course && !courses)
                    await Promise.all([loadCourse(), loadCourses(user.id)]);
                else if(user && course && courses)
                    await Promise.all([loadRequirements(course.id)]);
            }
            else{
                if(user && !courses)
                    await Promise.all([loadCourses(user.id)]);
                else if(user && !course && courses)
                    setCourse({"name": t("forms.placeholders.courseName"), "internalId": t("forms.placeholders.courseCode")})
            }
            if(user && course && courses && requirements)
                setLoading(false)
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[user, course, courses])

    useEffect( () => {
        setAvailableCourses(getFilteredCourses(requirements))
    },[courses])

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
            else{
                setUser(data)
            }
        })
    }

    const loadCourse = async () => {
        ApiService.getCourse(id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
              setCourse(data)
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

    const loadRequirements = async(courseId) => {
        ApiService.getRequiredCourses(course.id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
              setRequirements(data)
            }
        });
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (values.courseCode && values.courseName)
        {
            const resp = await ApiService.saveCourse(id, values.courseCode, values.courseName, requirements)
            if(resp.status == OK || resp.status == CREATED)
                navigate("/");
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

    const getFilteredCourses = (requirements) => {
        let availableCourses = []
        if(courses)
        {
            availableCourses = courses.filter(function(item) {
                const match = requirements.find((c) => c.id === item.id);
                return !match;
            });
            if(id){
                availableCourses = availableCourses.filter(function(item) {
                    return item.id !== id;
                });
            }
        }
        return availableCourses
    }

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
    }

    const onChangeCourseToAdd = (e) => {
        const course = courses.find((c) => c.id === e.target.value);
        if(course)
            setCourseToAdd(course)
    }

    const onClickTrashCan = (e) => {
        const requirementsCopy = Object.assign([], requirements);
        requirementsCopy.splice(requirements.indexOf(e), 1);
        setRequirements(requirementsCopy)
        setAvailableCourses(getFilteredCourses(requirementsCopy))
    }

    const addCourse = () => {
        if (!courseToAdd)
            return;
        const requirementsCopy = Object.assign([], requirements);
        requirementsCopy.push(courseToAdd);
        setRequirements(requirementsCopy)
        setAvailableCourses(getFilteredCourses(requirementsCopy))
        switchAddModal()
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
                <Helmet><title>{t(id?'forms.editCourse':'forms.createCourse')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editCourse':'forms.createCourse')}</h2>
                <Formik initialValues={{ courseName: course.name, courseCode: course.internalId }} validationSchema={CourseSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <FormInputField
                        label="forms.courseCode" name="courseCode"
                        placeholder="forms.placeholders.courseCode"
                        value={values.courseCode} error={errors.courseCode}
                        touched={touched.courseCode} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        label="forms.courseName" name="courseName"
                        placeholder="forms.placeholders.courseName"
                        value={values.courseName} error={errors.courseName}
                        touched={touched.courseName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Form.Group controlId="schedule" className="row mx-auto form-row">
                        <div className="col-3 text-end my-3 text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.requirements')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 align-items-start align-items-center">
                            {
                                requirements && requirements.length > 0? [
                                        requirements.map((entry, index) => (
                                            <Row
                                                key={'row-' + index} xs={1} md={4}
                                                className="border-bottom border-primary list-row px-5 pb-2 pt-3 justify-content-center"
                                            >
                                                <div className="my-auto">{entry.internalId}</div>
                                                <div className="my-auto w-min-50">
                                                    <a key={'link-' + entry.id} href={'/courses/' + entry.id}>
                                                        {entry.name}
                                                    </a>
                                                </div>
                                                <div className="d-flexmy-auto justify-content-center">
                                                    <i
                                                        className="bi bi-trash-fill btn btn-lg text-primary"
                                                        id={'trash-' + index}
                                                        onClick={() => onClickTrashCan(entry)}
                                                    ></i>
                                                </div>
                                            </Row>
                                        ))
                                ]:[<div key="empty-list">{t('emptyList')}</div>]
                            }
                            <div className="mx-auto align-items-center plus-button-container clickable">
                                <i className="me-3 bi bi-plus-circle-fill btn btn-lg color-primary" onClick={switchAddModal}></i>
                            </div>
                        </div>
                    </Form.Group>
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                    <Modal show={showAddModal} onHide={() => switchAddModal()} className="color-warning text-black">
                        <Modal.Header closeButton>
                            <Modal.Title>{t('modal.addCourse')}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {availableCourses && availableCourses.length > 0
                                ? [
                                      <Form.Select key="course-select" value={courseToAdd? courseToAdd.id:undefined} onChange={onChangeCourseToAdd} className="m-2">
                                          {availableCourses.map((c) => (
                                              <option key={c.id} value={c.id}>
                                                  {c.internalId + ' - ' + c.name}
                                              </option>
                                          ))}
                                      </Form.Select>,
                                  ]
                                : [
                                      <div className="text-center" key="no-courses-message">
                                          {t('modal.noRemainingCourses')}
                                      </div>,
                                  ]}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="grey" onClick={() => {switchAddModal()}}>
                                {t('modal.cancel')}
                            </Button>
                            {
                                courseToAdd && courseToAdd !== '' &&
                                <Button key="enabled-add" variant="secondary" onClick={() => {addCourse()}}>
                                    {t('modal.add')}
                                </Button>
                            }
                        </Modal.Footer>
                    </Modal>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditCoursePage;
