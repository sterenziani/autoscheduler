import React from 'react';
import {Button as BootstrapButton} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import { Translation } from 'react-i18next';

/*
    Props: href, text, textKey
    <Button
        textKey="tranlate.json.key"         // Tranlate Key for Button Text. Ignored if 'text' prop is present.
        href="/goto"                        // If present tells the Button where it should redirect on click.
        { ...reactBootstrapButtonProps }    // Any other props are passed down to Button from react-bootstrap.
    />
    Alternatively,
    <Button
        text="ButtonText"                   // Button Text
        href="/goto"                        // If present tells the Button where it should redirect on click.
        { ...reactBootstrapButtonProps }    // Any other props are passed down to Button from react-bootstrap.
    />
*/

const Button = props => {
    const { href, text, textKey, ...other } = props

    return href ? (
        <LinkContainer to={href}>
            <BootstrapButton { ...other }>{text ? (text) : (<Translation>{ t => t(`${textKey}`) }</Translation>)}</BootstrapButton>
        </LinkContainer>
    ) : (
        <BootstrapButton { ...other }> {text ? (text) : (<Translation>{ t => t(`${textKey}`) }</Translation>)}</BootstrapButton>
    );
}

export default Button;
