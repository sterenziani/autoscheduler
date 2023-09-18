import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SearchForm from './SearchForm';
import StudentCourseLog from '../Lists/StudentCourseLog';
import ApiService from '../../services/ApiService';
import { OK } from '../../services/ApiConstants';
import ErrorMessage from '../Common/ErrorMessage';

function HomePageStudent(props) {
    const { t } = useTranslation()
    const startingTab = "schedule_form"
    const search = useLocation().search
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)
    const [student, setStudent] = useState(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        if(student){
            const readTabInSearchParams = () => {
                const params = new URLSearchParams(search)
                const requestedTab = params.get('tab')
                if (requestedTab === "finished_courses")
                    return requestedTab
                return startingTab
            }

            const requestedTab = readTabInSearchParams()
            const tabs = document.getElementsByClassName("nav-item")
            if (requestedTab === "finished_courses")
                tabs[0].children[0].click()
            else
                tabs[1].children[0].click()
        }
    }, [search, student])

    useEffect(() => {
        setLoading(true)
        ApiService.getStudent(props.user.id).then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setStudent(resp)
            }
            setLoading(false)
        });
    }, [props.user.id])

    if (loading === true || student === null)
        return <div className="text-center m-auto mt-5 color-secondary"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t("search.search") +" - AutoScheduler"}</title></Helmet>
            </HelmetProvider>

            <div className="container mt-5">
                <Tabs className="borderless-tabs" defaultActiveKey="schedule_form" fill>
                    <Tab className="text-center" eventKey="finished_courses" title={t('tabs.courseLog')} id="finished_courses">
                        <div className="bg-primary rounded-bottom"><StudentCourseLog student={student}/></div>
                    </Tab>
                    <Tab className="text-center" eventKey="schedule_form" title={t('tabs.findSchedule')} id="schedule_form">
                        <div className="bg-primary rounded-bottom"><SearchForm student={student}/></div>
                    </Tab>
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default HomePageStudent;
