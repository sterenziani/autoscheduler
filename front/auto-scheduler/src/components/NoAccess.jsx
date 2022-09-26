import React from 'react';
import Alert from 'react-bootstrap/Alert';
import LinkButton from './LinkButton';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHand } from '@fortawesome/free-solid-svg-icons';

function NoAccess(props){
    const {t} = useTranslation()

    return <div className="m-5">
        <Alert variant="danger" className="text-center">
            <FontAwesomeIcon className="mb-3" size="3x" icon={faHand}/>
            <Alert.Heading>{t("accessDenied")}</Alert.Heading>
            <p>{t("noPermission")}</p>
            <LinkButton variant="primary" textKey="goHome" href="/"/>
        </Alert>
    </div>
}

export default NoAccess;
