import React, { useState, useEffect } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const FormInputField = (props) => {
    const { t } = useTranslation();
    const page = props.page;
    const prevPage = props.prevPage;
    const nextPage = props.nextPage;
    const loadContent = props.loadContent

    const movePagePrev = () => {
        loadContent(parseInt(page)-1)
    }

    const movePageNext = () => {
        loadContent(parseInt(page)+1)
    }

    return (
        <React.Fragment>
            <Row>
                <Col className="text-end">
                {
                    prevPage? [
                        <i className="bi bi-arrow-left-circle-fill btn btn-lg arrow-button-big color-white"
                        onClick={movePagePrev} key="prev-page-e"></i>
                    ] : [
                        <i className="bi bi-arrow-left-circle-fill btn btn-lg arrow-button-big disabled color-disabled" key="prev-page-d"></i>
                    ]
                }
                </Col>
                <h6 className="col my-auto page-number">Page {page}</h6>
                <Col className="text-start">
                {
                    nextPage? [
                        <i className="col text-start bi bi-arrow-right-circle-fill btn btn-lg arrow-button-big color-white"
                        onClick={movePageNext} key="next-page-e"></i>
                    ] : [
                        <i className="col text-start bi bi-arrow-right-circle-fill btn btn-lg arrow-button-big disabled color-disabled" key="next-page-d"></i>
                    ]
                }
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default FormInputField;
