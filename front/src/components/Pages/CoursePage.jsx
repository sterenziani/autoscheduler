import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, UNAUTHORIZED, FORBIDDEN } from '../../resources/ApiConstants';
import CourseRequirementsList from '../Lists/CourseRequirementsList';
import CourseClassesTab from '../Common/CourseClassesTab';
import Roles from '../../resources/RoleConstants';
import LinkButton from '../Common/LinkButton';
import ErrorMessage from '../Common/ErrorMessage';
import FormAsyncSelect from '../Common/FormAsyncSelect';

function CoursePage(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const {id} = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const [user] = useState(ApiService.getActiveUser())
    const [course, setCourse] = useState()
    const [selectedProgram, setSelectedProgram] = useState(null)
    const [noProgramsWarning, setNoProgramsWarning] = useState(false)

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [navigate, user])

    useEffect( () => {
        ApiService.getCourse(id).then((resp) => {
            if (resp && resp.status && resp.status !== OK)
                setError(resp.status)
            else
                setCourse(resp.data)
            setLoading(false)
        })
    }, [id])

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getProgramsCourseIsIn(id, inputValue).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setError(resp.status)
                    callback([])
                } else {
                    if(resp.data.length === 0)
                        setNoProgramsWarning(true)
                    callback(resp.data)
                }
            })
        })
    }

    const onChangePrograms = (program) => {
        setSelectedProgram(program)
    }

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.UNIVERSITY)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true)
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        )
    if (error)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet>
                    <title>{course ? course.internalId+" - "+course.name : ''} - AutoScheduler</title>
                </Helmet>
            </HelmetProvider>
            <div className="container my-5">
                <div className="mb-3 text-center text-primary">
                    <h6 className="m-0">{course.internalId}</h6>
                    <h2 className="">{course.name}</h2>
                </div>
                <Tabs className="borderless-tabs course-page-tabs" defaultActiveKey={'classes'} fill>
                    <Tab
                        className="text-center" eventKey="required_courses"
                        title={t('tabs.requiredCourses')}
                    >
                        <div className="bg-dark rounded-bottom py-4">
                        {
                            noProgramsWarning &&
                                <div className="mx-5 display-newlines py-2 text-center">
                                    <p className="mb-0">{t('errors.notPartOfAnyPrograms')}</p>
                                    <LinkButton variant="link" textKey="seePrograms" className="text-white" href={'/?tab=programs'}/>
                                </div>
                        }
                        {
                            !noProgramsWarning &&
                            <>
                                {
                                    !selectedProgram &&
                                    <div className="mx-5 display-newlines py-2 text-center">
                                        <p className="mb-0">{t('course.pickAProgram')}</p>
                                    </div>
                                }
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
                                />
                                {selectedProgram &&
                                    <>
                                        <CourseRequirementsList course={course} program={selectedProgram}/>
                                        <LinkButton className="my-3" variant="secondary" href={'/courses/' + course.id + '/edit'} textKey="edit"/>
                                    </>
                                }
                            </>
                        }
                        </div>
                    </Tab>
                    <Tab className="text-center" eventKey="classes" title={t('tabs.courseClasses')}>
                        <div className="bg-dark rounded-bottom">
                            <CourseClassesTab user={user} course={course} />
                        </div>
                    </Tab>
                </Tabs>
                <div className="mt-5 text-center">
                    <LinkButton variant="primary" textKey="goHome" href={'/'}/>
                </div>
            </div>
        </React.Fragment>
    );
}

export default CoursePage;
