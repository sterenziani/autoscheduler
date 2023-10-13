import React, {useState, useEffect} from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row } from 'react-bootstrap';
import Alert from 'react-bootstrap/Alert';
import LinkButton from '../Common/LinkButton';
import ApiService from '../../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import { DAYS, DEFAULT_DATE } from "../../services/SystemConstants";
import Roles from '../../resources/RoleConstants';
import AsyncSelect from 'react-select/async'
import ErrorMessage from '../Common/ErrorMessage';

const EXISTING_CLASS_ERROR = "COURSE_CLASS_ALREADY_EXISTS"

function EditCourseClassPage(props) {
    const CourseClassSchema = Yup.object().shape({
        className: Yup.string()
            .min(1, 'forms.errors.courseClass.minLength')
            .max(25, 'forms.errors.courseClass.maxLength')
            .required('forms.errors.courseClass.isRequired'),
    })

    const navigate = useNavigate()
    const {t} = useTranslation()
    const {id} = useParams()
    const search = useLocation().search

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const [user] = useState(ApiService.getActiveUser())
    const [buildings, setBuildings] = useState()
    const [buildingDictionary, setBuildingDictionary] = useState()
    const [terms, setTerms] = useState()

    const [courseClass, setCourseClass] = useState(null)
    const [selectedCourse, setSelectedCourse] = useState()
    const [selectedTermId, setselectedTermId] = useState()
    const [oldLectures, setOldLectures] = useState([])
    const [lectures, setLectures] = useState([])
    const [selectionError, setSelectionError] = useState()
    const [timeError, setTimeError] = useState()

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    useEffect( () => {
        const readCourseAndTerm = async () => {
            const params = new URLSearchParams(search)
            const courseId = params.get('course')
            const termId = params.get('term')
            setLoading(true)

            if(courseId) {
                ApiService.getCourse(courseId).then((resp) => {
                    if (resp && resp.status && resp.status !== OK){
                        setLoading(false)
                        setError(resp.status)
                    } else {
                        setSelectedCourse(resp.data)
                    }
                });
            } else {
                setSelectedCourse()
            }
            if(termId) {
                ApiService.getTerm(termId).then((resp) => {
                    if (resp && resp.status && resp.status !== OK){
                        setLoading(false)
                        setError(resp.status)
                    } else {
                        setselectedTermId(resp.data.id)
                    }
                })
            } else {
                setselectedTermId(terms[0].id)
            }
            setLoading(false)
        }

        const loadCourseClass = async () => {
            ApiService.getCourseClass(id, true, true, true, buildingDictionary).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else{
                    setCourseClass(resp.data)
                    setSelectedCourse(resp.data.course)
                    setselectedTermId(resp.data.term.id)

                    // If lecture's building is undefined, replace it with first option in list
                    const lecturesWithBuilding = []
                    for(const l of resp.data.lectures){
                        if(!l.building && buildings && buildings.length > 0){
                            l.building = buildings[0]
                        }
                        lecturesWithBuilding.push(l)
                    }
                    setLectures(lecturesWithBuilding)
                    setOldLectures(JSON.parse(JSON.stringify(lecturesWithBuilding)))
                }
            });
        }

        async function execute() {
            // 1. Load terms and buildings
            if(!terms && !buildings && !buildingDictionary)
                await Promise.all([loadTerms(user.id)], loadBuildings(user.id));
            if(terms && buildings && buildingDictionary) {
                // 2. Load courseClass or set placeholder
                if(!courseClass){
                    if(id) await Promise.all([loadCourseClass()])
                    else setCourseClass({name: t("forms.placeholders.className")})
                }

                // 3. Initialize new class values and end loading
                else {
                    if(!id && buildings.length > 0) {
                        const firstLecture = JSON.parse(JSON.stringify(DEFAULT_DATE))
                        setLectures([{...firstLecture, building: buildings[0]}])
                        await Promise.all([readCourseAndTerm()])
                    }
                    else
                        setLoading(false)
                }
            }
        }
        if(user) execute();
    },[courseClass, terms, buildings, buildingDictionary, id, t, user, search])

    const loadCourseOptions = (inputValue, callback) => {
        setTimeout(() => {
            if(!inputValue){
                callback([])
            } else {
                ApiService.getCourses(inputValue).then((resp) => {
                    if (resp && resp.status && resp.status !== OK){
                        setError(resp.status)
                        callback([])
                    } else {
                        callback(resp.data)
                    }
                })
            }
        })
    }

    const loadTerms = async (universityId) => {
        ApiService.getTerms().then((resp) => {
            if (resp && resp.status && resp.status !== OK){
                setLoading(false)
                setError(resp.status)
            }
            else
              setTerms(resp.data)
        });
    }

    const loadBuildings = async (universityId) => {
        ApiService.getBuildingDictionary().then((resp) => {
            if (resp && resp.status && resp.status !== OK){
                setLoading(false)
                setError(resp.status)
            } else {
                setBuildingDictionary(resp.data)
                setBuildings(Object.values(resp.data))
            }
        });
    }

    const onChangeCourse = (course) => {
        setSelectedCourse(course)
    }

    const onChangeTerm = (e) => {
        setselectedTermId(e.target.value)
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
        setTimeError(false)
    }

    const onChangeEndTime = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy[index].endTime = e.target.value;
        setLectures(lecturesCopy)
        setTimeError(false)
    }

    const onChangeBuilding = (e) => {
        const index = e.target.id.match(/\d/g)[0]
        const lecturesCopy = Object.assign([], lectures)
        lecturesCopy[index].building = buildingDictionary[e.target.value]
        setLectures(lecturesCopy)
    }

    const onClickTrashCan = (e) => {
        const index = e.target.id.match(/\d/g)[0];
        const lecturesCopy = Object.assign([], lectures);
        lecturesCopy.splice(index, 1);
        setLectures(lecturesCopy)
    }

    const onClickPlusSign = (e) => {
        const lecturesCopy = Object.assign([], lectures)
        const newLecture = JSON.parse(JSON.stringify(DEFAULT_DATE)) // Clone DEFAULT_DATE
        lecturesCopy.push({...newLecture, building: buildings[0]})
        setLectures(lecturesCopy)
    }

    const categorizeLectures = (oldLectures, newLectures) => {
        const categories = { post: [], put: [], delete: []}
        for(const oldL of oldLectures){
            const newL = newLectures.find(x => x.id === oldL.id)
            if(!newL) categories.delete.push(oldL)  // removed from list, DELETE old
            else if( JSON.stringify(oldL) !== JSON.stringify(newL) ) categories.put.push(newL) // values changed, PUT new
        }
        for(const newL of newLectures){
            const oldL = oldLectures.find(x => x.id === newL.id)
            if(!oldL) categories.post.push(newL)  // new in list, POST new
        }
        return categories
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true)
        for(const l of lectures){
            if(l.startTime >= l.endTime){
                setTimeError(true)
                setSubmitting(false)
                return
            }
        }

        if (selectedCourse && selectedTermId && values.className)
        {
            const categorizedLectures = categorizeLectures(oldLectures, lectures)
            const resp = await ApiService.saveCourseClass(id, selectedCourse.id, selectedTermId, values.className, categorizedLectures.post, categorizedLectures.put, categorizedLectures.delete)
            if(resp.status === OK || resp.status === CREATED)
                navigate("/courses/"+selectedCourse.id+"?termId="+selectedTermId)
            else{
                setError(resp.data?.code?? resp.status)
                setSubmitting(false)
            }
        }
        else {
            setSelectionError(true)
            setSubmitting(false)
        }
    };

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.UNIVERSITY)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error && error !== EXISTING_CLASS_ERROR)
        return <ErrorMessage status={error}/>

    if(!terms || terms.length < 1 || !buildings || buildings.length < 1)
        return (
        <Alert variant="danger" className="text-center m-5">
            {
                (!buildings || buildings.length < 1) && <p className="mx-4">{t("errors.noBuildings")}</p>
            }
            {
                (!terms || terms.length < 1) && <p className="mx-4">{t("errors.noTerms")}</p>
            }
            <LinkButton variant="primary" textKey="goHome" href="/"/>
        </Alert>
    )

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editClass':'forms.createClass')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editClass':'forms.createClass')}</h2>
                {error && (<p className="form-error">{t('forms.errors.courseClass.codeAlreadyTaken')}</p>)}
                {selectionError && (<p className="form-error">{t('forms.errors.courseClass.noCourseSelected')}</p>)}
                { timeError && <p key="program-error" className="form-error text-center my-0">{t('forms.errors.timeRange')}</p>}
                <Formik initialValues={{ className: courseClass.name }} validationSchema={CourseClassSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <Row className="mx-auto form-row">
                        <div className="col-3 text-end my-auto text-break">
                            <h5 className="my-0"><strong>{t('forms.course')}</strong></h5>
                        </div>
                        <div className="col-9 text-start">
                        {
                            id && <p className="my-auto text-center text-gray fw-normal">{courseClass.course.name}</p>
                        }
                        {
                            !id && selectedCourse &&
                            <AsyncSelect
                                className="text-black" cacheOptions defaultOptions
                                defaultValue = {{value:selectedCourse.id, internalId: selectedCourse.internalId, name: selectedCourse.name}}
                                getOptionLabel={e => e.internalId+' - '+e.name} getOptionValue={e => e.id}
                                noOptionsMessage={(inputValue) => {
                                    if(inputValue.inputValue.length > 0)
                                        return t('selectNoResults')
                                    return t('modal.inputTextToSearch')
                                }}
                                loadOptions={loadCourseOptions} onChange={opt => onChangeCourse(opt)}
                            />
                        }
                        {
                            !id && !selectedCourse &&
                            <AsyncSelect
                                className="text-black" cacheOptions defaultOptions
                                placeholder={t("forms.course")}
                                getOptionLabel={e => e.internalId+' - '+e.name} getOptionValue={e => e.id}
                                noOptionsMessage={(inputValue) => {
                                    if(inputValue.inputValue.length > 0)
                                        return t('selectNoResults')
                                    return t('modal.inputTextToSearch')
                                }}
                                loadOptions={loadCourseOptions} onChange={opt => onChangeCourse(opt)}
                            />
                        }
                        </div>
                    </Row>
                    <Form.Group controlId="term" className="row mx-auto form-row">
                        <div className="col-3 text-end my-auto text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.term')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 text-center">
                        {
                            <Form.Select value={selectedTermId} onChange={onChangeTerm}>
                                {terms && terms.map((c) => (
                                    <option key={c.id} value={c.id}> {c.internalId + ' - ' + c.name}</option>
                                ))}
                            </Form.Select>
                        }
                        </div>
                    </Form.Group>
                    <Form.Group controlId="class">
                        <FormInputField
                            label="forms.className" name="className"
                            placeholder="forms.placeholders.className"
                            value={values.className} error={errors.className}
                            touched={touched.className} onChange={handleChange} onBlur={handleBlur}
                        />
                    </Form.Group>
                    <Form.Group className="row mx-auto form-row">
                        <div className="col-3 text-end text-break my-4">
                            <h5 className=""><strong>{t('forms.lectures')}</strong></h5>
                        </div>
                        <div className="col-9 my-auto align-items-start">
                            {lectures.map((entry, index) => (
                                <Row key={'timerow-' + index} xs={1} md={6} className="list-row pb-2 pt-3 ms-1 justify-content-center">
                                    <Form.Select id={'day-' + index} className="w-auto mx-3" value={lectures[index].day} onChange={onChangeDay}>
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
                                    <Form.Select id={'building-' + index} className="w-auto ms-1" value={lectures[index].building?.id} onChange={onChangeBuilding}>
                                        {buildings.map((b) => (<option key={b.id} value={b.id}>{b.internalId}</option>))}
                                    </Form.Select>
                                    <i className="bi bi-trash-fill btn color-primary w-auto my-auto"
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
