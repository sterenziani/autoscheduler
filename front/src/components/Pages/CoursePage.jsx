import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';
import CourseRequirementsList from '../Lists/CourseRequirementsList';
import CourseClassesTab from '../Common/CourseClassesTab';
import NoAccess from '../Common/NoAccess';
import Roles from '../../resources/RoleConstants';
import LinkButton from '../Common/LinkButton';
import AsyncSelect from 'react-select/async'

function CoursePage(props) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {id} = useParams()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = ApiService.getActiveUser();
    const [course, setCourse] = useState();
    const [selectedProgram, setSelectedProgram] = useState(null);

    useEffect(() => {
        if(!user)
            navigate("/login")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        ApiService.getCourse(id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else {
                setCourse(data)
                setLoading(false)
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

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

    const onChangePrograms = (program) => {
        setSelectedProgram(program)
    }

    if(!user)
        return <React.Fragment/>
    if(user.type !== Roles.UNIVERSITY)
        return <NoAccess/>
    if (loading === true)
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        )
    if (error)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet>
                    <title>{course ? course.internalId : ''} - AutoScheduler</title>
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