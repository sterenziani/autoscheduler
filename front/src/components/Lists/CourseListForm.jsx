import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Row, Modal, Form, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import AsyncSelect from 'react-select/async'
import ApiService from '../../services/ApiService';
import ErrorMessage from '../Common/ErrorMessage';
import { OK } from '../../services/ApiConstants';

function CourseListForm(props) {
    const { t } = useTranslation();
    const listedCourses = props.listedCourses
    const addCourseOptions = props.addCourseOptions
    const unavailableCourses = props.unavailableCourses
    const onClickTrashCan = props.onClickTrashCan
    const addCourseToParent = props.addCourse
    const editCreditRequirements = props.editCreditRequirements
    const [showAddModal, setShowAddModal] = useState(false)
    const [courseToAdd, setCourseToAdd] = useState()
    const [creditRequirementToAdd, setCreditRequirementToAdd] = useState(0)
    const [error, setError] = useState()

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
        setCourseToAdd(undefined)
    }

    const addCourse = () => {
        if(editCreditRequirements)
            courseToAdd.requiredCredits = creditRequirementToAdd
        addCourseToParent(courseToAdd)
        setCourseToAdd(undefined)
        switchAddModal()
    }

    const onChangeCourseToAdd = (course) => {
        setCourseToAdd(course)
    }

    const loadRemainingCoursesOptions = (inputValue, callback) => {
        setTimeout(() => {
            if(!inputValue){
                callback([])
            }
            else{
                if(addCourseOptions){
                    const result = addCourseOptions.filter( (c) => !unavailableCourses.find((u) => u.id === c.id) && (c.name.includes(inputValue) || c.internalId.includes(inputValue)) )
                    callback(result)
                }
                ApiService.getCoursesNotInList(inputValue, unavailableCourses).then((resp) => {
                    if (resp && resp.status && resp.status !== OK){
                        setError(resp.status)
                        callback([])
                    } else {
                        callback(resp.data)
                    }
                })
            }
        })
    }

    if(error)
        return <ErrorMessage status={error}/>
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
                            <div className="my-auto w-min-50 justify-content-center">
                                <Col>
                                    <Row className="justify-content-center">
                                        <a key={'link-' + entry.id} href={'/courses/' + entry.id}>{entry.name}</a>
                                    </Row>
                                    <Row className="justify-content-center">
                                        { (editCreditRequirements && entry.requiredCredits > 0) && t('forms.courseRequiresCredits', {credits:entry.requiredCredits}) }
                                    </Row>
                                </Col>
                            </div>
                            <div className="d-flex my-auto justify-content-center">
                                <i
                                    className="bi bi-trash-fill btn btn-lg text-primary"
                                    id={'trash-' + index}
                                    onClick={() => onClickTrashCan(entry)}
                                ></i>
                            </div>
                        </Row>
                    ))
            ]:[<div className="mt-3" key="empty-list">{t('emptyList')}</div>]
        }
        <div className="mx-auto align-items-center plus-button-container clickable">
            <i className="bi bi-plus-circle-fill btn btn-lg color-primary" onClick={switchAddModal}></i>
        </div>
        <Modal show={showAddModal} onHide={() => switchAddModal()} className="color-warning text-black">
            <Modal.Header closeButton>
                <Modal.Title>{t('modal.addCourse')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {
                    <AsyncSelect key="course-select"
                        className="text-black m-2"
                        placeholder={t('forms.course')}
                        cacheOptions
                        defaultOptions
                        noOptionsMessage={(inputValue) => {
                            if(inputValue.inputValue.length > 0)
                                return t('selectNoResults')
                            return t('modal.inputTextToSearch')
                        }}
                        getOptionLabel={e => e.internalId+' - '+e.name}
                        getOptionValue={e => e.id}
                        loadOptions={loadRemainingCoursesOptions}
                        onChange={opt => onChangeCourseToAdd(opt)}
                    />
                }
                {
                    editCreditRequirements &&
                    <div>
                        <Form.Group controlId="requirement" className="row mx-auto form-row">
                            <Col className="col-6 text-end my-auto text-break">
                                <Form.Label className="col text-end my-auto">
                                    <h6 className="my-0">{t('modal.creditsRequired')}</h6>
                                </Form.Label>
                            </Col>
                            <Col className="col-4 my-auto">
                                <Form.Control
                                    type="number" min="0" value={creditRequirementToAdd}
                                    onChange={(e) => setCreditRequirementToAdd(e.target.value)}
                                />
                            </Col>
                            <Col className="col-2 my-auto text-center">
                                <OverlayTrigger data-bs-html="true" placement="bottom" overlay={(props) => (<Tooltip id="tooltip" className="popover" {...props}>{t('modal.creditsRequiredHint')}</Tooltip>)}>
                                    <h6 className="col my-auto"><span role="button"><i className="bi bi-question bg-primary text-white rounded-circle"></i></span></h6>
                                </OverlayTrigger>
                            </Col>
                        </Form.Group>
                    </div>
                }
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
