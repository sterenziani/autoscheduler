import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button, Modal, Spinner, Row, Col, Card } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';

function CourseClassesList(props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);

    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const course = props.course;
    const term = props.term;
    const [termClasses,setTermClasses] = useState(null);
    const [courseClassToDelete,setCourseClassToDelete] = useState({});

    useEffect( () => {
        async function execute() {
            await Promise.all([loadClasses()]);
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadClasses = () => {
        setLoading(true)
        ApiService.getCourseClassesForTerm(course.id, term.id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else
                setTermClasses(data)
            setLoading(false)
        });
    }

    const redirectToEdit = (id) => {
        navigate("/classes/"+id);
    }

    const redirectToCreate = () => {
        navigate("/classes/new");
    }

    const deleteCourseClass = () => {
        if (!courseClassToDelete)
            return;
        ApiService.deleteCourseClass(courseClassToDelete).then(() => {
            loadClasses()
            closeDeleteModal()
            setCourseClassToDelete({})
        })
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setCourseClassToDelete({})
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setCourseClassToDelete(e)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {error}</h1>;
    return (
        <React.Fragment>
            <div className="pt-4">
                {termClasses && termClasses.length > 0
                    ? [
                          <div key="courseClasss-list" className="my-3 container">
                              <Row xs={1} md={2} lg={3} className="g-4 m-auto justify-content-center">
                                  {termClasses.map((entry, index) => (
                                      <Card key={'card-' + index} className="m-3 p-0">
                                          <Card.Header className="bg-white text-primary text-start py-0 pe-0 me-0">
                                              <div className="d-flex ms-1">
                                                  <div className="text-start my-auto me-auto">
                                                      <Card.Title className="m-0 h6">
                                                          {entry.courseClass}
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
                                              {entry.lectures.map((l, lidx) => (
                                                  <Row key={'row-' + index + '-' + lidx}>
                                                      <Col className="text-start">
                                                          <b>
                                                              {t('days.' + l.day)}
                                                              :
                                                          </b>{' '}
                                                          {l.startTime}-{l.endTime} ({l.building})
                                                      </Col>
                                                  </Row>
                                              ))}
                                          </Card.Body>
                                      </Card>
                                  ))}
                              </Row>
                          </div>,
                      ]
                    : [
                          <div key="empty-list">
                              {t('emptyList')}
                          </div>,
                      ]}
            </div>
            <div className="mx-auto align-items-center plus-button-container clickable">
                <i
                    className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                    onClick={() => redirectToCreate()}
                ></i>
            </div>
            <Modal show={showDeleteModal} onHide={() => closeDeleteModal()} className="color-warning text-black">
                <Modal.Header closeButton>
                    <Modal.Title>{t('modal.deleteCourseClass')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                        {
                            t('modal.areYouSureClass', {
                                code: course.internalId,
                                name: course.name,
                                class: courseClassToDelete.courseClass,
                                term: term.name,
                            })
                        }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="grey" onClick={() => closeDeleteModal()}>
                        {t('modal.cancel')}
                    </Button>
                    <Button variant="danger" onClick={() => deleteCourseClass(courseClassToDelete)}>
                        {t('modal.delete')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

export default CourseClassesList;
