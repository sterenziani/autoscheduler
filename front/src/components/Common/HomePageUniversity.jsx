import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import UniversityProgramsList from '../Lists/UniversityProgramsList';
import UniversityCoursesList from '../Lists/UniversityCoursesList';
import UniversityBuildingsList from '../Lists/UniversityBuildingsList';
import UniversityTermsList from '../Lists/UniversityTermsList';

const CONTACT_EMAIL = process.env.REACT_APP_EMAIL_VERIFICATION_ADDRESS?? 'auto.scheduler.contact@gmail.com';

function HomePageUniversity(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useLocation().search

    const startingTab = "courses"
    const [activeTab, setActiveTab] = useState(startingTab)

    useEffect(() => {
        const readTabInSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedTab = params.get('tab')
            if(requestedTab === "buildings" || requestedTab === "terms" || requestedTab === "courses" || requestedTab === "programs")
                return requestedTab
            return startingTab
        }

        const requestedTab = readTabInSearchParams()
        if (activeTab !== requestedTab)
            setActiveTab(requestedTab)
    }, [search, activeTab])


    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            {props.user && !JSON.parse(props.user.verified) && (
                <Alert className="m-5 text-center display-newlines" variant="danger">
                    {t('home.getVerified', { email: CONTACT_EMAIL, universityName: props.user.name })}
                </Alert>
            )}
            <div className="container my-5 pb-5">
                <Tabs className="borderless-tabs" aria-label="home-tabs" defaultActiveKey={startingTab} activeKey={activeTab} onSelect={(k) => navigate("?tab="+k)} fill>
                    <Tab
                        className="text-center" eventKey="buildings"
                        title={t('tabs.buildings')} id="buildings-tab"
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityBuildingsList user={props.user} />
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
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default HomePageUniversity;
