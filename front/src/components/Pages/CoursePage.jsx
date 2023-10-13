import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import CourseRequirementsList from '../Lists/CourseRequirementsList';
import CourseClassesTab from '../Common/CourseClassesTab';
import Roles from '../../resources/RoleConstants';
import LinkButton from '../Common/LinkButton';
import ErrorMessage from '../Common/ErrorMessage';
import AsyncSelect from 'react-select/async'

function CoursePage(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const {id} = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const [user] = useState(ApiService.getActiveUser())
    const [course, setCourse] = useState()
    const [selectedProgram, setSelectedProgram] = useState(null);

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
                <Tabs className="borderless-tabs" defaultActiveKey={'classes'} fill>
                    <Tab
                        className="text-center" eventKey="required_courses"
                        title={t('tabs.requiredCourses')}
                    >
                        <div className="bg-primary rounded-bottom py-4">
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
                                selectedProgram && <CourseRequirementsList course={course} program={selectedProgram}/>
                            }
                            <LinkButton className="my-3" variant="secondary" href={'/courses/' + course.id + '/edit'} textKey="edit"/>
                        </div>
                    </Tab>
                    <Tab className="text-center" eventKey="classes" title={t('tabs.courseClasses')}>
                        <div className="bg-primary rounded-bottom">
                            <CourseClassesTab user={user} course={course} />
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default CoursePage;
