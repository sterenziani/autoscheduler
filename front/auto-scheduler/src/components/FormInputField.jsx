import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'react-bootstrap';

const FormInputField = (props) => {
    const { t } = useTranslation();
    const { type, label, placeholder, name, color, error, touched, ...other } = props;
    return (
        <React.Fragment>
            <Form.Group className={'row mx-auto form-row ' + 'text-' + color}>
                <div className="col-3 text-break text-end my-auto">
                    <Form.Label className="col text-end my-auto">
                        <h5 className="my-0"><strong>{t(`${label}`)}</strong></h5>
                    </Form.Label>
                </div>
                <div className="col-9">
                    <Form.Control type={type} placeholder={t(`${placeholder}`)} name={name} {...other} />
                    <p key={label + 'error'} className="form-error text-start my-0">
                        {error && touched && t(`${error}`)}
                    </p>
                </div>
            </Form.Group>
        </React.Fragment>
    );
};

export default FormInputField;
