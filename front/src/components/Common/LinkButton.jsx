import React from 'react';
import { Button as BootstrapButton } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const LinkButton = (props) => {
    const { t } = useTranslation()
    const { href, text, textKey, ...other } = props;

    return href ? (
        <Link as={Link} to={href}>
            <BootstrapButton {...other}>
                {text ? text : t(`${textKey}`)}
            </BootstrapButton>
        </Link>
    ) : (
        <BootstrapButton {...other}>
            {' '}
            {text ? text : t(`${textKey}`)}
        </BootstrapButton>
    );
};

export default LinkButton;
