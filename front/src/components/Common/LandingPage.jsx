import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import LinkButton from './LinkButton';
import Background from '../../resources/landing_bg.png';

function LandingPage(props) {
    const { t } = useTranslation()

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet>
                    <style>
                        {
                            `body { background-image: linear-gradient(rgba(255, 255, 255, 0.95), rgba(200, 250, 225, 0.85)), url(${Background}); \
                            -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover; background-size: cover; }`
                        }
                    </style>
                    <title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            <div className="p-3 pb-0 text-end">
                <h1 className="text-secondary text-center display-1 fw-bold pb-3 text-break">{t('landing.title')}</h1>
                <Row className="container pb-5 m-auto d-flex justify-content-center">
                    <Col className="p-1 px-5 text-black">
                        <div>
                            <h5>{t('landing.subtitle')}</h5>
                            <p>{t('landing.joinToDiscover')}</p>
                            <ul className="pt-3">
                                <li className="list-group-item m-2"><p className="fw-bold m-0">{t('landing.question3')}</p><ul><li className="list-group-item">{t('landing.answer3')}</li></ul></li>
                                <li className="list-group-item m-2"><p className="fw-bold m-0">{t('landing.question1')}</p><ul><li className="list-group-item">{t('landing.answer1')}</li></ul></li>
                                <li className="list-group-item m-2"><p className="fw-bold m-0">{t('landing.question4')}</p><ul><li className="list-group-item">{t('landing.answer4')}</li></ul></li>
                                <li className="list-group-item m-2"><p className="fw-bold m-0">{t('landing.question2')}</p><ul><li className="list-group-item">{t('landing.answer2')}</li></ul></li>
                            </ul>
                        </div>
                    </Col>
                    <Col className="text-start bg-primary rounded-end rounded-3 px-4 py-5 my-auto">
                        <div className="text-center d-flex flex-column">
                            <h4>{t('landing.joinNow')}</h4>
                            <div className="my-2 mx-auto">
                                <LinkButton className="m-2 text-primary" href="/login?tab=student" variant="white" textKey="landing.iAmStudent"/>
                                <LinkButton className="m-2 text-primary" href="/login?tab=university" variant="white" textKey="landing.iAmUniversty"/>
                            </div>
                            <div className="mt-4 m-2">
                                <p>{t('landing.alreadyRegistered')}</p>
                                <LinkButton className="mx-5" href="/login" variant="secondary" textKey="landing.signIn"/>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
}

export default LandingPage;
