import React, {useState, useEffect} from 'react';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Row, Button, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik, useFormikContext } from 'formik';
import LeavePagePrompt from '../Common/LeavePagePrompt'
import structuredClone from '@ungap/structured-clone';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import FormInputLabel from '../Common/FormInputLabel';
import CourseListForm from '../Lists/CourseListForm';
import { OK, NOT_FOUND, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../resources/ApiConstants';
import Roles from '../../resources/RoleConstants';
import FormAsyncSelect from '../Common/FormAsyncSelect';
import ErrorMessage from '../Common/ErrorMessage';
import LinkButton from '../Common/LinkButton';
import CourseProgramChecklist from '../Common/CourseProgramChecklist'

const EXISTING_COURSE_ERROR = "COURSE_ALREADY_EXISTS"
const INVALID_NAME_ERROR = "INVALID_NAME"

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
    })

    const navigate = useNavigate()
    const search = useLocation().search
    const {t} = useTranslation()
    const {id} = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const user = ApiService.getActiveUser()
    const [course, setCourse] = useState()
    const [programs, setPrograms] = useState()
    const [requirements, setRequirements] = useState()

    const [selectedProgram, setSelectedProgram] = useState()
    const [coursesOfSelectedProgram, setCoursesOfSelectedProgram] = useState()
    const [requestedProgram, setRequestedProgram] = useState()
    const [paramsProcessed, setParamsProcessed] = useState(false)
    const [programsData, setProgramsData] = useState()
    const [referral, setReferral] = useState('home')
    const [backtrack, setBacktrack] = useState('/')

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    // Resets state if ID changes
    useEffect(() => {
        return () => {
            setLoading(true)
            setError()
            setCourse()
            setPrograms()
            setRequirements()
            setSelectedProgram()
            setCoursesOfSelectedProgram()
            setRequestedProgram()
            setParamsProcessed()
            setProgramsData()
            setReferral('home')
            setBacktrack('/')
        }
    }, [id]);

    useEffect( () => {
        const loadCourse = async () => {
            ApiService.getCourse(id).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else{
                    setCourse(resp.data)
                    setRequirements({})
                }
            });
        }

        const loadPrograms = async(inputValue) => {
            ApiService.getProgramsCourseIsIn(id, inputValue).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setError(resp.status)
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

        execute()
    },[course, id, t, programs])

    useEffect( () => {
        if(requirements && programs && (!selectedProgram || coursesOfSelectedProgram))
            setLoading(false)
    },[requirements, coursesOfSelectedProgram, programs, selectedProgram])

    useEffect( () => {
        if(!requestedProgram && course && requirements){
            const params = new URLSearchParams(search)
            const request = params.get('program')
            const ref = params.get('ref')
            if(!request){
                setParamsProcessed(true)
            } else {
                ApiService.getProgram(request).then((resp) => {
                    if(resp && resp.status && resp.status === NOT_FOUND){
                        setParamsProcessed(true)
                        return
                    }
                    if(resp && resp.status && resp.status !== OK){
                        setError(resp.status)
                        setParamsProcessed(true)
                        return
                    }
                    // Select that program
                    const program = resp.data
                    setRequestedProgram(program)
                    onChangePrograms(program)
                    setParamsProcessed(true)
                })
            }

            switch(ref){
                case 'coursePage':
                    setReferral('coursePage')
                    setBacktrack('/courses/'+course.id)
                    break;
                case 'form':
                    setReferral('form')
                    setBacktrack('/')
                    break;
                default:
                    setReferral('home')
                    setBacktrack('/')
                    break;
            }
        }
    // eslint-disable-next-line
    },[search, course, requirements, requestedProgram])

    const loadRequirements = async(courseId, programId) => {
        ApiService.getRequiredCoursesForProgram(courseId, programId).then((resp) => {
            if (resp && resp.status && resp.status !== OK){
                setLoading(false)
                setError(resp.status)
            }
            else{
                const requirementsCopy = structuredClone(requirements)
                requirementsCopy[programId] = resp.data
                setRequirements(requirementsCopy)
            }
        });
    }

    const loadCoursesOfProgram = async(programId) => {
        const mandatoryCoursesResp = await ApiService.getMandatoryCourses(programId, false)
        const optionalCoursesResp = await ApiService.getOptionalCourses(programId, false)

        if(!mandatoryCoursesResp || mandatoryCoursesResp.status !== OK || !optionalCoursesResp || optionalCoursesResp.status !== OK){
            if(mandatoryCoursesResp.status !== OK)
                setError(mandatoryCoursesResp.status)
            if(optionalCoursesResp.status !== OK)
                setError(optionalCoursesResp.status)
            setLoading(false)
            return
        }

        mandatoryCoursesResp.data.forEach((item, i) => delete item['requiredCredits']);
        optionalCoursesResp.data.forEach((item, i) => delete item['requiredCredits']);
        setCoursesOfSelectedProgram([...mandatoryCoursesResp.data, ...optionalCoursesResp.data])
    }

    const [modifiedRequirements, setModifiedRequirements] = useState(false)
    const [unsavedForm, setUnsavedForm] = useState(false)
    const FormObserver = () => {
        const { values } = useFormikContext()

        useEffect(() => {
            const internalIdChanged = (course && values.courseCode !== course.internalId)
            const nameChanged = (course && values.courseName !== course.name)
            const creditsChanged = (course && values.courseCredits !== course.creditValue)

            setUnsavedForm(internalIdChanged || nameChanged || creditsChanged || modifiedRequirements)
        }, [values]);
        return null;
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true)
        if (values.courseCode && values.courseName)
        {
            const requirementIDs = {}
            Object.keys(requirements).forEach(key => {
                requirementIDs[key] = requirements[key].map(a => a.id)
            })

            const resp = await ApiService.saveCourse(id, values.courseName, values.courseCode, values.courseCredits, programsData, requirementIDs)
            if(resp.status === CREATED){
                const programsAdded = Object.values(programsData).filter(p => p.isIn).length
                if(programsAdded > 0)
                    navigate("/courses/"+resp.id+"/edit?ref=form", {replace: true})
                else
                    navigate("/courses/"+resp.id)
            }
            else if(resp.status === OK)
                navigate("/courses/"+resp.id)
            else{
                setError(resp.data?.code?? resp.status)
                setSubmitting(false)
            }
        }
        else {
            setSubmitting(false)
        }
    };

    const onClickTrashCan = (e) => {
        const requirementsCopy = Object.assign([], requirements)
        requirementsCopy[selectedProgram.id].splice(requirements[selectedProgram.id].indexOf(e), 1)
        setRequirements(requirementsCopy)
        setModifiedRequirements(true) // Easier than processing whole requirements map every time
    }

    const addRequiredCourse = (courseToAdd) => {
        if (!courseToAdd)
            return;
        const requirementsCopy = structuredClone(requirements)
        if(!requirementsCopy[selectedProgram.id])
            requirementsCopy[selectedProgram.id] = []
        requirementsCopy[selectedProgram.id].push(courseToAdd)
        setRequirements(requirementsCopy)
        setModifiedRequirements(true) // Easier than processing whole requirements map every time
    }

    const onChangePrograms = (program) => {
        loadCoursesOfProgram(program.id)
        if(!requirements[program.id]) {
            if(course.id){
                loadRequirements(course.id, program.id)
            }
            else {
                const requirementsCopy = structuredClone(requirements)
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
        return (<ErrorMessage status={UNAUTHORIZED}/>)
    if(user.role !== Roles.UNIVERSITY)
        return (<ErrorMessage status={FORBIDDEN}/>)
    if (loading === true)
        return (<div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>)
    if (error && error !== EXISTING_COURSE_ERROR && error !== INVALID_NAME_ERROR)
        return (<ErrorMessage status={error}/>)

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editCourse':'forms.createCourse')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h1 className="mt-3">{t(id?'forms.editCourse':'forms.createCourse')}</h1>
                {error && error === EXISTING_COURSE_ERROR && (<p className="form-error">{t('forms.errors.course.codeAlreadyTaken')}</p>)}
                {error && error === INVALID_NAME_ERROR && (<p className="form-error">{t('forms.errors.invalidName')}</p>)}

                <Formik initialValues={{ courseName: course.name, courseCode: course.internalId, courseCredits: course.creditValue  }} validationSchema={CourseSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <LeavePagePrompt when={unsavedForm && !isSubmitting}/>
                    <FormObserver/>

                    {
                        referral!=='form' &&
                        <>
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
                                tooltipMessage="forms.creditsEarnedTooltip"
                                id="program-optional-credits"
                                label="forms.creditsEarned" name="courseCredits"
                                type="number" placeholder="0" min="0"
                                value={values.courseCredits} error={errors.courseCredits}
                                touched={touched.courseCredits} onChange={handleChange} onBlur={handleBlur}
                            />
                            {
                                id &&
                                <Row key="requirements-group" className='py-0 mx-auto form-row text-center'>
                                    <FormInputLabel label="forms.courseClasses"/>
                                    <div className="col-md-9 text-start">
                                        <LinkButton variant="link" className="m-0 p-0" textKey="seeClasses" href={`/courses/${id}`}/>
                                    </div>
                                </Row>
                            }
                        </>
                    }
                    {
                        referral==='form' &&
                        <p className="mb-5 display-newlines">{t('forms.courseSavedNowEditRequiredCourses')}</p>
                    }
                    {
                        (id && programs && programs.length > 0 && paramsProcessed)? [
                            <Row key="requirements-group" className='mx-auto form-row text-center'>
                                <FormInputLabel label="forms.requirements"/>
                                <div className="col-md-9">
                                    <FormAsyncSelect
                                        className="text-black text-start w-75 m-auto"
                                        placeholder={t('register.program')}
                                        cacheOptions
                                        defaultOptions
                                        noOptionsMessage={() => t('selectNoResults')}
                                        getOptionLabel={e => e.internalId+' - '+e.name}
                                        getOptionValue={e => e.id}
                                        loadOptions={loadProgramOptions}
                                        onChange={opt => onChangePrograms(opt)}
                                        defaultValue = {requestedProgram? {value:requestedProgram.id, internalId: requestedProgram.internalId, name: requestedProgram.name}:undefined}
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
                            </Row>
                        ] : [
                                id &&
                                <div key="no-requirements-message" className="mt-5 mb-3">
                                    <p className="mb-0">{t('errors.notPartOfAnyPrograms')}</p>
                                    <div className="text-center">
                                        <LinkButton variant="link" textKey="seePrograms" href={'/?tab=programs'}/>
                                    </div>
                                </div>
                        ]
                    }
                    {
                        !id &&
                        <CourseProgramChecklist setProgramsData={(x) => setProgramsData(x)} programsData={programsData}/>
                    }
                    <Button className="m-3" variant="outline-dark" href={backtrack}>
                        {referral==='form' ? t("goHome") : t("modal.cancel")}
                    </Button>
                    <Button className="m-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditCoursePage;
