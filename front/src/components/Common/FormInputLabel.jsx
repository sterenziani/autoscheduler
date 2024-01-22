import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap';

const FormInputLabel = (props) => {
    const { t } = useTranslation()
    const { label, tooltipMessage, columnWidth, tooltipIconColor, tooltipBgColor } = props

    return (
        <div className={"col-md-"+(columnWidth??3)+" text-break my-auto d-flex justify-content-start justify-content-md-end"}>
            {
                tooltipMessage &&
                <div className="m-auto mx-3">
                    <OverlayTrigger data-bs-html="true" placement="bottom" overlay={(props) => (<Tooltip id="tooltip" className="popover col" {...props}>{t(tooltipMessage)}</Tooltip>)}>
                        <h6 className="col my-auto"><span role="button"><i className={`bi bi-question rounded-circle m-auto text-${tooltipIconColor??'white'} bg-${tooltipBgColor??'primary'}`}></i></span></h6>
                    </OverlayTrigger>
                </div>
            }
            {
                props.controlId? [
                    <Form.Label className="text-end my-auto">
                        <h5 className="m-2 mx-md-0 my-md-0"><strong>{t(`${label}`)}</strong></h5>
                    </Form.Label>
                ]:[
                    <div key={"key-"+label} className="text-end my-auto">
                        <h5 className="m-2 mx-md-0 my-md-0"><strong>{t(`${label}`)}</strong></h5>
                    </div>
                ]
            }

        </div>
    );
};

export default FormInputLabel;
