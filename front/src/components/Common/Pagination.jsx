import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Pagination = (props) => {
    const { t } = useTranslation()
    const page = props.page
    const links = props.links? props.links : {}
    const loadContent = props.loadContent
    const [selectedPage, setSelectedPage] = useState(1)

    const prevPage = links.prev;
    const nextPage = links.next;
    const lastPage = (links.last && (links.last.includes("page=")))? parseInt(links.last.split("page=")[1].match(/\d+/))+1 : 1
    const [showModal, setShowModal] = useState(false)

    const movePagePrev = () => {
        loadContent(parseInt(page)-1)
    }

    const movePageNext = () => {
        loadContent(parseInt(page)+1)
    }

    const goToSelectedPage = (requestedPage) => {
        if(selectedPage > lastPage)
            requestedPage = lastPage
        if(selectedPage <= 0)
            requestedPage = 1
        setShowModal(false)
        loadContent(parseInt(requestedPage))
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

                <Col className="d-flex">
                <OverlayTrigger overlay={(props) => (<Tooltip id="tooltip" {...props}>{t('pagination.popover')}</Tooltip>)}>
                    <h6 onClick={() => setShowModal(true)} className="col my-auto page-number"><span role="button">{t('pagination.page', {page: page})}</span></h6>
                </OverlayTrigger>
                </Col>

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

            <Modal show={showModal} onHide={() => setShowModal(false)} className="color-warning text-black">
                <Modal.Header closeButton>
                    <Modal.Title>{t('pagination.goToPage')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <Row>
                    <Col><Form.Control id="page-text-selector" type="number" className="text-end" min="1" max={lastPage} defaultValue={page} onChange={(e) => setSelectedPage(e.target.value)}/></Col>
                    <Col xs={1} className="my-auto text-center">/</Col>
                    <Col className="my-auto text-start ml-5">{lastPage}</Col>
                </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => goToSelectedPage(selectedPage)}>
                        {t('pagination.go')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

export default Pagination;
