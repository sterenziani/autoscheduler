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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = ApiService.getActiveUser();
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [courses,setCourses] = useState(props.course);
    const [courseToDelete,setCourseToDelete] = useState();

    useEffect( () => {
        async function execute() {
            await Promise.all([loadCourses()]);
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const redirectToEdit = (id) => {
        navigate("/courses/"+id+"/edit")
    }

    const loadCourses = () => {
        if (user.type === Roles.STUDENT) {
            ApiService.getFinishedCourses(user).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED)
                    findError = data.status;
                if (findError){
                    setError(true)
                    setStatus(findError)
                }
                else
                    setCourses(data)
                setLoading(false)
            });
        } else if (user.type === Roles.UNIVERSITY) {
            ApiService.getCourses(user.id).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED)
                    findError = data.status;
                if (findError){
                    setError(true)
                    setStatus(findError)
                }
                else
                    setCourses(data)
                setLoading(false)
            });
        }
    }

    const deleteCourse = () => {
        if (!courseToDelete) return;
        if (user.type === Roles.STUDENT)
            ApiService.deleteFinishedCourse(user, courseToDelete.id);
        else if (user.type === Roles.UNIVERSITY)
            ApiService.deleteCourse(courseToDelete);
        closeDeleteModal()
        loadCourses();
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setCourseToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setCourseToDelete(e)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <div data-testid="content" className="pt-4">
                {courses && courses.length > 0
                    ? [
                          courses.map((entry, index) => (
                              <Row
                                  key={'row-' + index} xs={1} md={4}
                                  className="border-bottom border-grey list-row px-5 pb-2 pt-3 justify-content-center"
                              >
                                  <div className="my-auto">{entry.internalId}</div>
                                  <div className="my-auto w-min-50">
                                      {user.type === Roles.UNIVERSITY
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
                                      {user.type === Roles.UNIVERSITY
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
