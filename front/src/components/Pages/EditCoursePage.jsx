import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Row, Button, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import CourseListForm from '../Lists/CourseListForm';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import Roles from '../../resources/RoleConstants';
import AsyncSelect from 'react-select/async'
import ErrorMessage from '../Common/ErrorMessage';

const EXISTING_COURSE_ERROR = "COURSE_ALREADY_EXISTS"

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
        courseCredits: Yup.number().min(0, 'forms.errors.course.positiveZeroOptionalCredits'),
    });

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams();
    const [user] = useState(ApiService.getActiveUser())
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);

    const [course, setCourse] = useState(null);
    const [programs, setPrograms] = useState();
    const [requirements, setRequirements] = useState();
    const [selectedProgram, setSelectedProgram] = useState();
    const [coursesOfSelectedProgram, setCoursesOfSelectedProgram] = useState();

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    useEffect( () => {
        const loadCourse = async () => {
            ApiService.getCourse(id).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK && resp.status !== CREATED)
                    findError = resp.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else{
                    setCourse(resp.data)
                    setRequirements({})
                }
            });
        }

        const loadPrograms = async(inputValue) => {
            ApiService.getProgramsCourseIsIn(id, inputValue).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    setPrograms([])
                } else {
                    setPrograms(resp.data)
                }
            })
        }

        async function execute() {
            if(!course && !programs){
                if(id) await Promise.all([loadCourse(), loadPrograms("")]);
                else {
                    setCourse({"name": t("forms.placeholders.courseName"), "internalId": t("forms.placeholders.courseCode"), "creditValue": 0})
                    setRequirements({})
                    setPrograms([])
                }
            }
        }
        if(user) execute()
    },[course, id, t, user, programs])

    useEffect( () => {
        if(requirements && programs && (!selectedProgram || coursesOfSelectedProgram)) setLoading(false)
    },[requirements, coursesOfSelectedProgram, programs, selectedProgram])

    const loadRequirements = async(courseId, programId) => {
        ApiService.getRequiredCoursesForProgram(courseId, programId).then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                const requirementsCopy = Object.assign([], requirements);
                requirementsCopy[programId] = resp.data;
                setRequirements(requirementsCopy)
            }
        });
    }

    const loadCoursesOfProgram = async(programId) => {
        const mandatoryCoursesResp = await ApiService.getMandatoryCourses(programId, false)
        const optionalCoursesResp = await ApiService.getOptionalCourses(programId, false)
        let findError = null;
        if(!mandatoryCoursesResp || mandatoryCoursesResp.status !== OK || !optionalCoursesResp || optionalCoursesResp.status !== OK){
            if(mandatoryCoursesResp.status !== OK)
                findError = mandatoryCoursesResp.status
            if(optionalCoursesResp.status !== OK)
                findError = optionalCoursesResp.status
            setLoading(false)
            setError(true)
            setStatus(findError)
            return
        }

        mandatoryCoursesResp.data.forEach((item, i) => delete item['requiredCredits']);
        optionalCoursesResp.data.forEach((item, i) => delete item['requiredCredits']);

        setCoursesOfSelectedProgram([...mandatoryCoursesResp.data, ...optionalCoursesResp.data])
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (values.courseCode && values.courseName)
        {
            const requirementIDs = {}
            Object.keys(requirements).forEach(key => {
                requirementIDs[key] = requirements[key].map(a => a.id)
            })

            const resp = await ApiService.saveCourse(id, values.courseName, values.courseCode, values.courseCredits, requirementIDs)
            if(resp.status === OK || resp.status === CREATED){
                navigate("/courses/"+resp.id)
            }
            else{
                setError(resp.data.code)
                setStatus(resp.status)
                setSubmitting(false)
            }
        }
        else {
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
        loadCoursesOfProgram(program.id)
        if(!requirements[program.id]) {
            if(course.id){
                loadRequirements(course.id, program.id)
            }
            else {
                const requirementsCopy = Object.assign({}, requirements)
                requirementsCopy[program.id] = []
                setRequirements(requirementsCopy)
            }
        }
        setSelectedProgram(program)
    }

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            const progs = programs?? []
            callback(progs.filter((p) => p.name.includes(inputValue) || p.internalId.includes(inputValue)))
        })
    }

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.UNIVERSITY)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error && error !== EXISTING_COURSE_ERROR)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editCourse':'forms.createCourse')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editCourse':'forms.createCourse')}</h2>
                {error && (<p className="form-error">{t('forms.errors.course.codeAlreadyTaken')}</p>)}
                <Formik initialValues={{ courseName: course.name, courseCode: course.internalId, courseCredits: course.creditValue  }} validationSchema={CourseSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <FormInputField
                        id="course-code"
                        label="forms.courseCode" name="courseCode"
                        placeholder="forms.placeholders.courseCode"
                        value={values.courseCode} error={errors.courseCode}
                        touched={touched.courseCode} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        id="course-name"
                        label="forms.courseName" name="courseName"
                        placeholder="forms.placeholders.courseName"
                        value={values.courseName} error={errors.courseName}
                        touched={touched.courseName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        id="program-optional-credits"
                        label="forms.creditsEarned" name="courseCredits"
                        placeholder="0"
                        value={values.courseCredits} error={errors.courseCredits}
                        touched={touched.courseCredits} onChange={handleChange} onBlur={handleBlur}
                    />
                    {
                        (id && programs && programs.length > 0)? [
                        <Row key="requirements-row" className="mx-auto form-row">
                            <div className="col-3 text-end my-3 text-break">
                                <h5 className="my-0"><strong>{t('forms.requirements')}</strong></h5>
                            </div>
                            <div className="col-9 my-2 align-items-start align-items-center">
                                <AsyncSelect
                                    className="text-black text-start w-75 m-auto"
                                    placeholder={t('register.program')}
                                    cacheOptions
                                    defaultOptions
                                    noOptionsMessage={() => t('selectNoResults')}
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
                                        addCourseOptions={coursesOfSelectedProgram??[]}
                                        onClickTrashCan={onClickTrashCan} addCourse={addRequiredCourse}
                                    />
                                }
                                {
                                    !selectedProgram && <div>{t('forms.selectProgram')}</div>
                                }
                            </div>
                        </Row>] : [
                            <p key="no-requirements-message" className="mt-5">{t('errors.notPartOfAnyPrograms')}</p>
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

export default EditCoursePage;
