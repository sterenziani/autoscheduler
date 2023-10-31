import React, {useEffect} from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import { Tabs, Tab } from 'react-bootstrap';
import SignUpStudentForm from '../Accounts/SignUpStudentForm';
import SignUpUniversityForm from '../Accounts/SignUpUniversityForm';
import SignInForm from '../Accounts/SignInForm';
import Background from '../../resources/landing_bg.png';

function SignUpPage(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const user = ApiService.getActiveUser()
    const search = useLocation().search

    useEffect(() => {
        if(user)
            navigate("/")
    }, [user, navigate])

    useEffect(() => {
        const readTabInSearchParams = () => {
            const params = new URLSearchParams(search)
            return params.get('tab')
        }

        const requestedTab = readTabInSearchParams()
        const tabs = document.getElementsByClassName("nav-item")
        if (requestedTab === "student")
            tabs[0].children[0].click()
        else if (requestedTab === "university")
            tabs[2].children[0].click()
        else
            tabs[1].children[0].click()
    }, [search])

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
                    <title>AutoScheduler</title>
                </Helmet>
            </HelmetProvider>
            <div className="container my-5">
                <Tabs
                    className="borderless-tabs" fill
                    defaultActiveKey={props.login ? 'log_in' : 'i_am_student'}
                >
                    <Tab
                        className="text-center"
                        eventKey="i_am_student"
                        title={t('tabs.iAmStudent')}
                    >
                        <div className="bg-primary rounded-bottom"><SignUpStudentForm /></div>
                    </Tab>
                    <Tab
                        className="text-center"
                        eventKey="log_in"
                        title={t('tabs.login')}
                    >
                        <div className="bg-primary rounded-bottom"><SignInForm /></div>
                    </Tab>
                    <Tab
                        className="text-center"
                        eventKey="i_am_university"
                        title={t('tabs.iAmUniversty')}
                    >
                        <div className="bg-primary rounded-bottom"><SignUpUniversityForm /></div>
                    </Tab>
                </Tabs>
            </div>
        </React.Fragment>
    );
}

export default SignUpPage;
