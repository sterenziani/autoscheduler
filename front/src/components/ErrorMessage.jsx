import React from 'react';
import Alert from 'react-bootstrap/Alert';
import LinkButton from './LinkButton';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

function NoAccess(props){
    const { t } = useTranslation()
    const message = props.message
    const status = props.status

    return <div className="m-5">
        <Alert variant="primary" className="text-center">
            { !status && <FontAwesomeIcon className="mb-3" size="3x" icon={faCircleExclamation}/> }
            { status && <Alert.Heading>{status}</Alert.Heading> }
            <Alert.Heading>{status}</Alert.Heading>
            <p>{t(message)}</p>
        </Alert>
    </div>
}

export default NoAccess;
