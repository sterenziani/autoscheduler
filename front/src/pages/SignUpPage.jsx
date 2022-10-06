import React, {useEffect} from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import ApiService from '../services/ApiService';
import { Tabs, Tab } from 'react-bootstrap';
import SignUpStudentForm from '../components/Accounts/SignUpStudentForm';
import SignUpUniversityForm from '../components/Accounts/SignUpUniversityForm';
import SignInForm from '../components/Accounts/SignInForm';

function SignUpPage(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const user = ApiService.getActiveUser()

    useEffect(() => {
        if(user)
            navigate("/")
    }, [user])

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
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
