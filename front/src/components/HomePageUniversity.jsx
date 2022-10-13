import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import UniversityProgramsList from './Lists/UniversityProgramsList';
import UniversityCoursesList from './Lists/UniversityCoursesList';
import UniversityBuildingsList from './Lists/UniversityBuildingsList';
import UniversityTermsList from './Lists/UniversityTermsList';

const CONTACT_EMAIL = 'juan@autoscheduler.com';

function HomePageUniversity(props) {
    const { t } = useTranslation()
    const query = new URLSearchParams(useLocation().search).get('tab')
    const startingTab = query? query:"programs"
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
                <Tabs className="borderless-tabs" defaultActiveKey={startingTab} fill>
                    <Tab
                        className="text-center" eventKey="buildings"
                        title={t('tabs.buildings')}
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityBuildingsList user={props.user} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center" eventKey="programs"
                        title={t('tabs.programs')}
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityProgramsList user={props.user} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center" eventKey="courses"
                        title={t('tabs.courses')}
                    >
                        <div className="bg-primary rounded-bottom">
                            <UniversityCoursesList user={props.user} />
                        </div>
                    </Tab>
                    <Tab
                        className="text-center" eventKey="terms"
                        title={t('tabs.terms')}
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
