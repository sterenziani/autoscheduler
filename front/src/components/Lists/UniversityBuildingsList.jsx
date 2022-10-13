import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';

function UniversityBuildingsList(props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const user = props.user;
    const [buildings, setBuildings] = useState(null);
    const [buildingToDelete, setBuildingToDelete] = useState();
    const [prevPage, setPrevPage] = useState();
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState();

    useEffect(() => {
        loadBuildings(1);
        setNextPage(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadBuildings = (page) => {
        setLoading(true)
        ApiService.getBuildings(user.id, page).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setBuildings(data)
            }
            setLoading(false)
        });
    }

    const redirectToEdit = (id) => {
        navigate('/buildings/' + id)
    }

    const redirectToCreate = () => {
        navigate("/buildings/new")
    }

    const deleteBuilding = () => {
        if (!buildingToDelete)
            return;
        ApiService.deleteBuilding(buildingToDelete);
        closeDeleteModal()
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setBuildingToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setBuildingToDelete(e)
    }

    const movePagePrev = () => {
        loadBuildings(page-1)
        setPage(page-1)
        setPrevPage()
        setNextPage(true)
    }

    const movePageNext = () => {
        loadBuildings(page+1)
        setPage(page+1)
        setPrevPage(true)
        setNextPage()
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {error}</h1>;
    return (
        <React.Fragment>
            <div className="pt-4">
                {buildings && buildings.length > 0
                    ? [
                          <div key="buildings-list" className="my-3 container">
                              <Row xs={1} md={2} lg={3} className="g-4 m-auto justify-content-center">
                                  {buildings.map((entry, index) => (
                                      <Card key={'card-' + index} className="m-3 p-0">
                                          <Card.Header className="bg-white text-primary text-start py-0 pe-0 me-0">
                                              <div className="d-flex ms-1">
                                                  <div className="text-start my-auto me-auto">
                                                      <Card.Title className="m-0 h6">
                                                          {entry.internalId + ' - ' + entry.name}
                                                      </Card.Title>
                                                  </div>
                                                  <div className="d-flex my-auto text-center">
                                                      <i
                                                          className="bi bi-pencil-fill btn btn-lg"
                                                          id={'edit-' + index}
                                                          onClick={() => redirectToEdit(entry.id)}
                                                      ></i>
                                                      <i
                                                          className="bi bi-trash-fill btn btn-lg"
                                                          id={'trash-' + index}
                                                          onClick={() => openDeleteModal(entry)}
                                                      ></i>
                                                  </div>
                                              </div>
                                          </Card.Header>
                                          <Card.Body className="bg-grey text-black">
                                              {entry.distances.map((b, bidx) => (
                                                  <Row key={'row-' + index + '-' + bidx}>
                                                        <Col className="text-end">{b.building.name}</Col>
                                                        <Col className="text-start">{t('minutes', { minutes: b.time })}</Col>
                                                  </Row>
                                              ))}
                                          </Card.Body>
                                      </Card>
                                  ))}
                              </Row>
                          </div>,
                      ]
                    : [
                          <div key="empty-list">{t('emptyList')}</div>,
                      ]}
            </div>
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
                <h6 className="col my-auto">Page {page}</h6>
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
            <div className="mx-auto align-items-center plus-button-container clickable">
                <i
                    className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                    onClick={() => redirectToCreate()}
                ></i>
            </div>
            <Modal show={showDeleteModal} onHide={() => closeDeleteModal()} className="color-warning text-black">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t('modal.deleteBuilding')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        buildingToDelete &&
                        t('modal.areYouSureBuilding', {
                            code: buildingToDelete.internalId,
                            name: buildingToDelete.name,
                        })
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="grey" onClick={() => closeDeleteModal()}>
                        {t('modal.cancel')}
                    </Button>
                    <Button variant="danger" onClick={() => deleteBuilding(buildingToDelete)}>
                        {t('modal.delete')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

export default UniversityBuildingsList;
