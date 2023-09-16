import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function HomePageAdmin(props) {
    const { t } = useTranslation()

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            {props.user && (
                <Alert className="m-5 text-center" variant="primary">
                    {t('home.welcomeAdmin')}
                </Alert>
            )}
        </React.Fragment>
    );
}

export default HomePageAdmin;
