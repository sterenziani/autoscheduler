import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import UniversityProgramsList from '../Lists/UniversityProgramsList';
import UniversityCoursesList from '../Lists/UniversityCoursesList';
import UniversityBuildingsList from '../Lists/UniversityBuildingsList';
import UniversityTermsList from '../Lists/UniversityTermsList';

const CONTACT_EMAIL = 'juan@autoscheduler.com';

function HomePageUniversity(props) {
    const { t } = useTranslation()
    const startingTab = "programs";
    const search = useLocation().search

    const readTabInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        if (requestedTab == "buildings" || requestedTab == "courses" || requestedTab == "terms")
            return requestedTab
        return startingTab
    }

    useEffect(() => {
        const requestedTab = readTabInSearchParams()
        let tabs = document.getElementsByClassName("nav-item")
        if (requestedTab == "buildings")
            tabs[0].children[0].click()
        else if (requestedTab == "courses")
            tabs[2].children[0].click()
        else if (requestedTab == "terms")
            tabs[3].children[0].click()
        else
            tabs[1].children[0].click()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation().search])

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            {props.user && !props.user.verified && (
                <Alert className="m-5" variant="danger">
                    {t('home.getVerified', { email: CONTACT_EMAIL })}
                </Alert>
            )}
            <div className="container my-5">
                <Tabs className="borderless-tabs" aria-label="home-tabs" defaultActiveKey={startingTab} fill>
                    <Tab
                        className="text-center" eventKey="buildings"
                        title={t('tabs.buildings')} id="buildings-tab"
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityBuildingsList user={props.user} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center" eventKey="programs"
                        title={t('tabs.programs')} id="programs-tab"
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityProgramsList user={props.user} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center" eventKey="courses"
                        title={t('tabs.courses')} id="courses-tab"
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityCoursesList user={props.user} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center" eventKey="terms"
                        title={t('tabs.terms')} id="terms-tab"
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityTermsList user={props.user} />
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default HomePageUniversity;
