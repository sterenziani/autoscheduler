import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../components/FormInputField';
import CourseListForm from '../components/Lists/CourseListForm';
import { OK, CREATED } from '../services/ApiConstants';
import NoAccess from '../components/NoAccess';
import Roles from '../resources/RoleConstants';

function EditCoursePage(props) {
    const CourseSchema = Yup.object().shape({
        courseCode: Yup.string()
            .min(1, 'forms.errors.course.minCodeLength')
            .max(25, 'forms.errors.course.maxCodeLength')
            .required('forms.errors.course.codeIsRequired'),
        courseName: Yup.string()
            .min(3, 'forms.errors.course.minNameLength')
            .max(50, 'forms.errors.course.maxNameLength')
            .required('forms.errors.course.nameIsRequired'),
    });

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams();
    const user = ApiService.getActiveUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [selectionError, setSelectionError] = useState();

    const [course, setCourse] = useState(null);
    const [requirements, setRequirements] = useState();
    const [availableCourses, setAvailableCourses] = useState();
    const [courses, setCourses] = useState(null);
    const [programs, setPrograms] = useState();
    const [selectedProgram, setSelectedProgram] = useState();

    useEffect(() => {
        if(!user)
            navigate("/login")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        async function execute() {
            if(id){
                if(user && !course && !courses)
                    await Promise.all([loadCourse(), loadCourses(user.id), loadPrograms(user.id)]);
                else if(user && courses && programs && course)
                    await Promise.all([loadRequirements(course.id)]);
            }
            else if(user && courses && programs && !course){
                setCourse({"name": t("forms.placeholders.courseName"), "internalId": t("forms.placeholders.courseCode")})
                setRequirements({})
            }
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[course, courses])

    useEffect( () => {
        if(requirements && selectedProgram)
        {
            setAvailableCourses(getFilteredCourses(requirements, selectedProgram.id))
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[requirements])

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

    const loadPrograms = async (universityId) => {
        ApiService.getPrograms(universityId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else {
                setPrograms(data)
                setSelectedProgram(data[0])
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
            if(resp.status === OK || resp.status === CREATED){
                if(id)
                    navigate("/courses/"+id)
                else
                    navigate("/?tab=courses")
            }
            else{
                setError(true)
                setStatus(resp.status)
                setSubmitting(false);
            }
        }
        else {
            setSelectionError(true)
            setSubmitting(false)
        }
    };

    const getFilteredCourses = (requiredCourses, programId) => {
        let availableCourses = []
        let coursesToRemove = []
        if(requiredCourses[programId])
            coursesToRemove = [...coursesToRemove, ...requiredCourses[programId]]
        if(courses)
        {
            availableCourses = courses.filter(function(item) {
                const match = coursesToRemove.find((c) => c.id === item.id);
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

    const onClickTrashCan = (e) => {
        const requirementsCopy = Object.assign([], requirements);
        requirementsCopy[selectedProgram.id].splice(requirements[selectedProgram.id].indexOf(e), 1);
        setRequirements(requirementsCopy)
    }

    const addRequiredCourse = (courseToAdd) => {
        if (!courseToAdd)
            return;
        const requirementsCopy = Object.assign({}, requirements)
        if(!requirementsCopy[selectedProgram.id])
            requirementsCopy[selectedProgram.id] = []
        requirementsCopy[selectedProgram.id].push(courseToAdd)
        setRequirements(requirementsCopy)
    }

    const onChangePrograms = (e) => {
        // eslint-disable-next-line
        setSelectedProgram(programs.filter((p) => p.id == e.target.value)[0])
        setAvailableCourses(getFilteredCourses(requirements, e.target.value))
    }

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
                    <Form.Group controlId="requirements" className="row mx-auto form-row">
                        <div className="col-3 text-end my-3 text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.requirements')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 align-items-start align-items-center">
                            <Form.Select className="w-75 m-auto" value={selectedProgram.id} onChange={onChangePrograms}>
                                {programs.map((p) => (<option key={p.id} value={p.id}> {p.internalId + ' - ' + p.name}</option>))}
                            </Form.Select>
                            <CourseListForm courses={courses}
                                listedCourses={requirements[selectedProgram.id]} availableCourses={availableCourses}
                                onClickTrashCan={onClickTrashCan} addCourse={addRequiredCourse}
                            />
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

export default EditCoursePage;
