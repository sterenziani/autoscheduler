import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';
import CourseList from './CourseList';
import AsyncSelect from 'react-select/async'

function StudentCourseLog(props) {
    const { t } = jest ? {t:s=>s} : useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = ApiService.getActiveUser();

    const [showAddModal,setShowAddModal] = useState(false);
    const [selectedProgram,setSelectedProgram] = useState(user.program.id);
    const [courseToAdd,setCourseToAdd] = useState();

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
    }

    const onChangePrograms = (programId) => {
        setSelectedProgram(programId)
        setCourseToAdd()
    }

    const onChangeCourseToAdd = (courseId) => {
        setCourseToAdd(courseId)
    }

    const addCourse = () => {
        if (!courseToAdd)
            return;
        setLoading(true)
        ApiService.addFinishedCourse(user, courseToAdd).then((data) => {
            switchAddModal()
            setCourseToAdd()
            setLoading(false)
        });
    }

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getPrograms(user.university.id, inputValue).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(data)
                }
            })
        })
    }

    const loadRemainingCoursesOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getRemainingCoursesProgram(user, selectedProgram, inputValue).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(data)
                }
            })
        })
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            {user && <CourseList key={'list'} user={user}/>}
            {
                <div key="div-prog">
                    <div className="mx-auto align-items-center plus-button-container clickable">
                        <i
                            className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                            onClick={() => switchAddModal()}
                        ></i>
                    </div>
                    <Modal show={showAddModal} onHide={() => switchAddModal()} className="color-warning text-black">
                        <Modal.Header closeButton>
                            <Modal.Title>{t('modal.addCourse')}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <AsyncSelect
                                className="text-black m-2"
                                placeholder={t('search.program')}
                                defaultOptions
                                getOptionLabel={e => e.internalId+' - '+e.name}
                                getOptionValue={e => e.id}
                                defaultInputValue={user.program.name}
                                defaultValue={user.program.id}
                                loadOptions={loadProgramOptions}
                                onChange={opt => onChangePrograms(opt.id)}
                            />
                            <AsyncSelect key={selectedProgram}
                                className="text-black m-2"
                                placeholder={t('forms.course')}
                                cacheOptions
                                defaultOptions
                                noOptionsMessage={(inputValue) => {
                                    if(inputValue.inputValue.length > 0)
                                        return t('selectNoResults')
                                    return t('modal.noRemainingCoursesProgram')
                                }}
                                getOptionLabel={e => e.internalId+' - '+e.name}
                                getOptionValue={e => e.id}
                                loadOptions={loadRemainingCoursesOptions}
                                onChange={opt => onChangeCourseToAdd(opt.id)}
                            />
                        </Modal.Body>
                        <Modal.Footer>
                        <Button variant="grey" onClick={() => {switchAddModal()}}>
                            {t('modal.cancel')}
                        </Button>
                        {courseToAdd && courseToAdd !== ''
                        ? [
                            <Button key="enabled-add" variant="secondary" onClick={() => {addCourse(courseToAdd)}}>
                                {t('modal.add')}
                            </Button>
                        ]
                        : [
                            <Button key="disabled-add" disabled variant="grey" onClick={() => {addCourse(courseToAdd)}}>
                                {t('modal.add')}
                            </Button>
                        ]}
                        </Modal.Footer>
                        </Modal>
                </div>
            }
        </React.Fragment>
    );
}

export default StudentCourseLog;
