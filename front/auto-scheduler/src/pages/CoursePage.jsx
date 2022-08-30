import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Translation } from 'react-i18next';
import { Tabs, Tab, Spinner } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import CourseRequirementsList from '../components/Lists/CourseRequirementsList';
import CourseClassesTab from '../components/CourseClassesTab';

function CoursePage(props) {
    const {id} = useParams()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [user, setUser] = useState();
    const [course, setCourse] = useState();

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
                ApiService.getActiveUser().then((userData) => {
                    let findError = null;
                    if (userData && userData.status && userData.status !== OK && userData.status !== CREATED)
                        findError = userData.status;
                    if (findError){
                        setError(true)
                        setStatus(findError)
                    }
                    else{
                        setUser(userData)
                        setCourse(data)
                    }
                    setLoading(false)
                });
            }
        });
    }, [id])

    if (loading === true)
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    if (error)
        return <h1>ERROR {status}</h1>;
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
                        className="text-center"
                        eventKey="required_courses"
                        title={<Translation>{(t) => t('tabs.requiredCourses')}</Translation>}
                    >
                        <div className="bg-primary rounded-bottom">
                            <CourseRequirementsList course={course} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center"
                        eventKey="classes"
                        title={<Translation>{(t) => t('tabs.courseClasses')}</Translation>}
                    >
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
