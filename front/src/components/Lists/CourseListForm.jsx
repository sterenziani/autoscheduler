import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Row, Modal } from 'react-bootstrap';
import AsyncSelect from 'react-select/async'
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';

function CourseListForm(props) {
    const {t} = useTranslation();
    const user = ApiService.getActiveUser();
    const listedCourses = props.listedCourses
    const unavailableCourses = props.unavailableCourses
    const onClickTrashCan = props.onClickTrashCan
    const addCourseToParent = props.addCourse
    const [showAddModal, setShowAddModal] = useState(false);
    const [courseToAdd, setCourseToAdd] = useState();
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
        setCourseToAdd(undefined)
    }

    const addCourse = () => {
        addCourseToParent(courseToAdd)
        setCourseToAdd(undefined)
        switchAddModal()
        // eslint-disable-next-line
    }

    const onChangeCourseToAdd = (course) => {
        setCourseToAdd(course)
    }

    const loadRemainingCoursesOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getCourses(user.id, inputValue).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED)
                    findError = data.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    callback([])
                } else {
                    const availableCourses = data.filter((item) => !unavailableCourses.find((c) => c.id === item.id))
                    callback(availableCourses)
                }
            })
        })
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
                            return t('modal.noRemainingCourses')
                        }}
                        getOptionLabel={e => e.internalId+' - '+e.name}
                        getOptionValue={e => e.id}
                        loadOptions={loadRemainingCoursesOptions}
                        onChange={opt => onChangeCourseToAdd(opt)}
                    />
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
