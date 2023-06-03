import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';
import Roles from '../../resources/RoleConstants';

function CourseList(props){
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = ApiService.getActiveUser();
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [courseToDelete,setCourseToDelete] = useState();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.courses])

    const redirectToEdit = (id) => {
        navigate("/courses/"+id+"/edit")
    }

    const deleteCourse = () => {
        if (!courseToDelete) return;
        if (user.role === Roles.STUDENT)
            ApiService.deleteFinishedCourse(user.id, courseToDelete.id);
        else if (user.role === Roles.UNIVERSITY)
            ApiService.deleteCourse(courseToDelete);
        closeDeleteModal()
        props.reloadCourses()
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setCourseToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setCourseToDelete(e)
    }

    return (
        <React.Fragment>
            <div data-testid="content" className="pt-4">
                {props.courses && props.courses.length > 0
                    ? [
                          props.courses.map((entry, index) => (
                              <Row
                                  key={'row-' + index} xs={1} md={4}
                                  className="border-bottom border-grey list-row px-5 pb-2 pt-3 justify-content-center"
                              >
                                  <div className="my-auto">{entry.internalId}</div>
                                  <div className="my-auto w-min-50">
                                      {user.role === Roles.UNIVERSITY
                                          ? [
                                                <a
                                                    key={'link-' + entry.id}
                                                    className="text-white"
                                                    href={'/courses/' + entry.id}
                                                >
                                                    {entry.name}
                                                </a>,
                                            ]
                                          : [<div key={'nada-' + entry.id}>{entry.name}</div>]}
                                  </div>
                                  <div className="d-flexmy-auto justify-content-center">
                                      {user.role === Roles.UNIVERSITY
                                          ? [
                                                <i
                                                    key={'pencil-' + index}
                                                    className="bi bi-pencil-fill btn btn-lg text-white"
                                                    id={'edit-' + index}
                                                    onClick={() => redirectToEdit(entry.id)}
                                                ></i>,
                                            ]
                                          : []}
                                      <i
                                          className="bi bi-trash-fill btn btn-lg text-white"
                                          id={'trash-' + index}
                                          data-testid={'trash-' + index}
                                          onClick={() => openDeleteModal(entry)}
                                      ></i>
                                  </div>
                              </Row>
                          )),
                      ]
                    : [
                          <div key="empty-list">{t('emptyList')}</div>,
                      ]}
            </div>
            <Modal
                show={showDeleteModal}
                onHide={() => closeDeleteModal()}
                className="color-warning text-black"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t('modal.deleteCourse')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        courseToDelete &&
                        t('modal.areYouSureCourse', {
                            code: courseToDelete.internalId,
                            name: courseToDelete.name,
                        })
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="grey" onClick={() => closeDeleteModal()}>
                        {t('modal.cancel')}
                    </Button>
                    <Button variant="danger" onClick={() => deleteCourse(courseToDelete)}>
                        {t('modal.delete')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

export default CourseList;
