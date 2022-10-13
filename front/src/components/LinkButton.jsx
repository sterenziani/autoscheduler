import React from 'react';
import { Button as BootstrapButton } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useTranslation } from 'react-i18next';

const LinkButton = (props) => {
    const { t } = useTranslation()
    const { href, text, textKey, ...other } = props;

    return href ? (
        <LinkContainer to={href}>
            <BootstrapButton {...other}>
                {text ? text : t(`${textKey}`)}
            </BootstrapButton>
        </LinkContainer>
    ) : (
        <BootstrapButton {...other}>
            {' '}
            {text ? text : t(`${textKey}`)}
        </BootstrapButton>
    );
};

export default LinkButton;
