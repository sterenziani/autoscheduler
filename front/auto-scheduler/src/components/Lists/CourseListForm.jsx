import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Modal } from 'react-bootstrap';
import FormInputField from '../FormInputField';

function CourseListForm(props) {
    const {t} = useTranslation();
    const listedCourses = props.listedCourses
    const availableCourses = props.availableCourses
    const onClickTrashCan = props.onClickTrashCan
    const addCourseToParent = props.addCourse
    const [showAddModal, setShowAddModal] = useState(false);
    const [courseToAdd, setCourseToAdd] = useState();

    useEffect( () => {
        setCourseToAdd(availableCourses[0])
    },[availableCourses])

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
    }

    const addCourse = () => {
        addCourseToParent(courseToAdd)
        setCourseToAdd(undefined)
        switchAddModal()
        if(availableCourses[0] != courseToAdd)
            setCourseToAdd(availableCourses[0])
        else if(availableCourses.length>1)
            setCourseToAdd(availableCourses[1])
    }

    const onChangeCourseToAdd = (e) => {
        const course = props.courses.find((c) => c.id === e.target.value);
        if(course) setCourseToAdd(course)
    }

    return(
        <React.Fragment>
        {
            listedCourses && listedCourses.length > 0? [
                    listedCourses.map((entry, index) => (
                        <Row
                            key={'row-' + index} xs={1} md={4}
                            className="border-bottom border-primary list-row px-5 pb-2 pt-3 justify-content-center"
                        >
                            <div className="my-auto">{entry.internalId}</div>
                            <div className="my-auto w-min-50">
                                <a key={'link-' + entry.id} href={'/programs/' + entry.id}>
                                    {entry.name}
                                </a>
                            </div>
                            <div className="d-flexmy-auto justify-content-center">
                                <i
                                    className="bi bi-trash-fill btn btn-lg text-primary"
                                    id={'trash-' + index}
                                    onClick={() => onClickTrashCan(entry)}
                                ></i>
                            </div>
                        </Row>
                    ))
            ]:[<div key="empty-list">{t('emptyList')}</div>]
        }
        <div className="mx-auto align-items-center plus-button-container clickable">
            <i className="bi bi-plus-circle-fill btn btn-lg color-primary" onClick={switchAddModal}></i>
        </div>
        <Modal show={showAddModal} onHide={() => switchAddModal()} className="color-warning text-black">
            <Modal.Header closeButton>
                <Modal.Title>{t('modal.addCourse')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {availableCourses && availableCourses.length > 0
                    ? [
                        <Form.Select
                            key="course-select" value={courseToAdd? courseToAdd.id:undefined}
                            onChange={onChangeCourseToAdd} className="m-2">
                            {availableCourses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.internalId + ' - ' + c.name}
                                </option>
                            ))}
                        </Form.Select>
                      ]
                    : [
                          <div className="text-center" key="no-courses-message">
                              {t('modal.noRemainingCourses')}
                          </div>,
                      ]}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="grey" onClick={() => {switchAddModal()}}>
                    {t('modal.cancel')}
                </Button>
                {
                    courseToAdd && courseToAdd !== '' &&
                    <Button key="enabled-add" variant="secondary" onClick={() => {addCourse()}}>
                        {t('modal.add')}
                    </Button>
                }
            </Modal.Footer>
        </Modal>
        </React.Fragment>
    )
}

export default CourseListForm;
