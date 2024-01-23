import React, { useState } from 'react';
import { Button, Modal, Row } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import Roles from '../../resources/RoleConstants';

function CourseList(props){
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = ApiService.getActiveUser();
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [courseToDelete,setCourseToDelete] = useState();

    const redirectToEdit = (id) => {
        navigate("/courses/"+id+"/edit")
    }

    const deleteCourse = async () => {
        if (!courseToDelete) return;
        if (user.role === Roles.STUDENT)
            await ApiService.deleteFinishedCourse(courseToDelete.id)
        else if (user.role === Roles.UNIVERSITY)
            await ApiService.deleteCourse(courseToDelete.id)
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
                                  <div className="my-auto">
                                    <div>{entry.internalId}</div>
                                    {
                                        !!entry.creditValue && entry.creditValue > 0 && <div>{t('forms.courseCreditsValue', {credits: entry.creditValue})}</div>
                                    }
                                  </div>
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
                                  <div className="d-flex my-auto justify-content-center">
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
                        <div key="emptyCourseListWarning" className="px-5">
                          {
                              user.role === Roles.UNIVERSITY && <p>{t('emptyList')}</p>
                          }
                          {
                              user.role === Roles.STUDENT && <p>{t('registerFinishedCourses')}</p>
                          }
                        </div>,
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
