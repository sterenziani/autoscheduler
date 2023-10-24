import React from 'react';
import Alert from 'react-bootstrap/Alert';
import LinkButton from './LinkButton';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faQuestionCircle, faPlugCircleXmark, faHand } from '@fortawesome/free-solid-svg-icons';
import { UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVICE_UNAVAILABLE } from '../../resources/ApiConstants';

function ErrorMessage(props){
    const { t } = useTranslation()
    const navigate = useNavigate()

    let icon = faCircleExclamation
    let title =  "ERROR "+props.status
    let message = props.message? t(props.message) : t("errors."+props.status)
    if(message === "errors."+props.status)
        message = ""

    if(props.status === UNAUTHORIZED || props.status === FORBIDDEN){
        icon = faHand
        title = t("errors.accessDenied")
    }
    if(props.status === NOT_FOUND){
        icon = faQuestionCircle
        title = t("errors.notFound")
    }
    if(props.status === SERVICE_UNAVAILABLE){
        icon = faPlugCircleXmark
    }

    const goHome = () => {
        if(window.location.pathname === "/")
            window.location.reload()
        else
            navigate("/")
    }

    return <div className="p-5">
        <Alert variant="danger" className="text-center">
            <FontAwesomeIcon className="mb-3" size="3x" icon={icon}/>
            <Alert.Heading>{title}</Alert.Heading>
            <p className="display-newlines mx-4">{message}</p>
            <LinkButton variant="primary" textKey="goHome" onClick={goHome}/>
        </Alert>
    </div>
}

export default ErrorMessage;
