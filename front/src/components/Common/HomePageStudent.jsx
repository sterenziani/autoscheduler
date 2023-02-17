import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import SearchForm from './SearchForm';
import StudentCourseLog from '../Lists/StudentCourseLog';
import { useLocation } from 'react-router-dom';

function HomePageStudent(props) {
    const { t } = useTranslation()
    const startingTab = "schedule_form";
    const search = useLocation().search

    const readTabInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        if (requestedTab == "finished_courses")
            return requestedTab
        return startingTab
    }

    useEffect(() => {
        const requestedTab = readTabInSearchParams()
        let tabs = document.getElementsByClassName("nav-item")
        if (requestedTab == "finished_courses")
            tabs[0].children[0].click()
        else
            tabs[1].children[0].click()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation().search])

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t("search.search") +" - AutoScheduler"}</title></Helmet>
            </HelmetProvider>
            <div className="container mt-5">
                <Tabs className="borderless-tabs" defaultActiveKey="schedule_form" fill>
                    <Tab className="text-center" eventKey="finished_courses" title={t('tabs.courseLog')} id="finished_courses">
                        <div className="bg-primary rounded-bottom"><StudentCourseLog/></div>
                    </Tab>
                    <Tab className="text-center" eventKey="schedule_form" title={t('tabs.findSchedule')} id="schedule_form">
                        <div className="bg-primary rounded-bottom"><SearchForm/></div>
                    </Tab>
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default HomePageStudent;
