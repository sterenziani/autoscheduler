import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import CourseListForm from '../Lists/CourseListForm';
import { OK, CREATED } from '../../services/ApiConstants';
import NoAccess from '../Common/NoAccess';
import Roles from '../../resources/RoleConstants';
import AsyncSelect from 'react-select/async'

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
    const [selectedProgram, setSelectedProgram] = useState();

    useEffect(() => {
        if(!user)
            navigate("/login")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        async function execute() {
            if(id){
                if(user && !course)
                    await Promise.all([loadCourse()]);
                else if(user && course)
                    await Promise.all([loadRequirements(course.id)]);
            }
            else if(user && !course){
                setCourse({"name": t("forms.placeholders.courseName"), "internalId": t("forms.placeholders.courseCode")})
                setRequirements({})
                setLoading(false)
            }
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[course])

    useEffect( () => {
        if(requirements)
            setLoading(false)
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

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getPrograms(user.id, inputValue).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(data)
                }
            })
        })
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

    const onChangePrograms = (program) => {
        if(!requirements[program.id]){
            const requirementsCopy = Object.assign({}, requirements)
            requirementsCopy[program] = []
            setRequirements(requirementsCopy)
        }
        setSelectedProgram(program)
    }

    if(!user)
        return <React.Fragment/>
    if(user.type !== Roles.UNIVERSITY)
        return <NoAccess/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error)
        return <ErrorMessage status={status}/>
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
                        <div className="col-9 my-2 align-items-start align-items-center">
                            <AsyncSelect
                                className="text-black text-start w-75 m-auto"
                                placeholder={t('register.program')}
                                cacheOptions
                                defaultOptions
                                getOptionLabel={e => e.internalId+' - '+e.name}
                                getOptionValue={e => e.id}
                                loadOptions={loadProgramOptions}
                                onChange={opt => onChangePrograms(opt)}
                            />
                            {
                                selectedProgram &&
                                <CourseListForm
                                    listedCourses={requirements[selectedProgram.id]}
                                    unavailableCourses={
                                        (requirements[selectedProgram.id])? [...requirements[selectedProgram.id], course] : [course]
                                    }
                                    onClickTrashCan={onClickTrashCan} addCourse={addRequiredCourse}
                                />
                            }
                            {
                                !selectedProgram && <div>{t('forms.selectProgram')}</div>
                            }
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