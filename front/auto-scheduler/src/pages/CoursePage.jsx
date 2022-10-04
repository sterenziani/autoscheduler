import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Form, Spinner } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { OK, CREATED } from '../services/ApiConstants';
import CourseRequirementsList from '../components/Lists/CourseRequirementsList';
import CourseClassesTab from '../components/CourseClassesTab';
import NoAccess from '../components/NoAccess';
import Roles from '../resources/RoleConstants';
import LinkButton from '../components/LinkButton';

function CoursePage(props) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {id} = useParams()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = ApiService.getActiveUser();
    const [course, setCourse] = useState();
    const [programs, setPrograms] = useState(null);
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
                loadPrograms(data)
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const loadPrograms = () => {
        if(user){
            ApiService.getPrograms(user.id).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED)
                    findError = data.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else {
                    setPrograms(data)
                    setSelectedProgram(data[0])
                }
            })
        }
    }

    useEffect(() => {
        if(programs && selectedProgram)
            setLoading(false)
    }, [programs, selectedProgram])

    const onChangePrograms = (e) => {
        // eslint-disable-next-line
        setSelectedProgram(programs.filter((p) => p.id == e.target.value)[0])
    }

    if(user.type !== Roles.UNIVERSITY)
        return <NoAccess/>
    if (loading === true)
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        )
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
                        className="text-center" eventKey="required_courses"
                        title={t('tabs.requiredCourses')}
                    >
                        <div className="bg-primary rounded-bottom py-4">
                            <Form.Select className="w-75 m-auto" value={selectedProgram.id} onChange={onChangePrograms}>
                                {programs.map((p) => (<option key={p.id} value={p.id}> {p.internalId + ' - ' + p.name}</option>))}
                            </Form.Select>
                            <CourseRequirementsList course={course} program={selectedProgram} />
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
