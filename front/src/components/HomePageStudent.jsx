import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Tabs, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import SearchForm from '../components/SearchForm';
import StudentCourseLog from '../components/Lists/StudentCourseLog';

function HomePageStudent(props) {
    const { t } = jest ? {t:s=>s} : useTranslation()
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t("search.search") +" - AutoScheduler"}</title></Helmet>
            </HelmetProvider>
            <div className="container mt-5">
                <Tabs className="borderless-tabs" defaultActiveKey="schedule_form" fill>
                    <Tab className="text-center" eventKey="classes" title={t('tabs.courseLog')}>
                        <div className="bg-primary rounded-bottom"><StudentCourseLog/></div>
                    </Tab>
                    <Tab className="text-center" eventKey="schedule_form" title={t('tabs.findSchedule')}>
                        <div className="bg-primary rounded-bottom"><SearchForm/></div>
                    </Tab>
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default HomePageStudent;
