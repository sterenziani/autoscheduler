import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FormInputLabel from './FormInputLabel';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const FormInputField = (props) => {
    const { t } = useTranslation()
    const { type, label, placeholder, name, color, error, touched, id, tooltipMessage, labelColumnWidth, ...other } = props
    const isPasswordField = (props.type === "password")
    const [passwordType, setPasswordType] = useState("password")

    const toggleVisibility = () => {
        const newType = (passwordType === "password")? "text":"password"
        setPasswordType(newType)
    }

    return (
        <React.Fragment>
            <Form.Group controlId={"input-"+id} className='row mx-auto form-row text-center'>
                <FormInputLabel columnWidth={labelColumnWidth} {...props}/>
                <div className="col-md-9">
                    <div className="d-flex">
                        <Form.Control
                            type={isPasswordField? passwordType:type}
                            placeholder={t(`${placeholder}`)}
                            name={name} {...other}
                        />
                        {
                            isPasswordField &&
                            <Button variant="link text-white" onClick={toggleVisibility}>
                                <FontAwesomeIcon size="1x" icon={(passwordType === "password")? faEyeSlash:faEye} />
                            </Button>
                        }
                    </div>
                    <p key={label + 'error'} className="form-error text-start my-0">
                        {error && touched && t(`${error}`)}
                    </p>
                </div>
            </Form.Group>
        </React.Fragment>
    );
};

export default FormInputField;
