import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';
import CourseList from './CourseList';
import AsyncSelect from 'react-select/async'
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';

function StudentCourseLog(props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState(null);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const student = props.student;

    const [prevPage, setPrevPage] = useState(false);
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState(false);
    const search = useLocation().search;

    const [showAddModal,setShowAddModal] = useState(false);
    const [selectedProgram,setSelectedProgram] = useState(student.program.id);
    const [courseToAdd,setCourseToAdd] = useState();

    const readPageInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        let requestedPage = params.get('page')
        if(!requestedTab || requestedTab != "finished_courses")
            return null
        if(!requestedPage)
            requestedPage = 1
        return requestedPage
    }

    useEffect(() => {
        let requestedPage = readPageInSearchParams()
        if(!requestedPage)
            requestedPage = 1
        if(!courses || requestedPage != page){
            setPage(requestedPage)
            loadCourses(requestedPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation().search])

    const changePage = (newPage) => {
        setPage(newPage)
        loadCourses(newPage)
        navigate("?tab=finished_courses&page="+newPage)
    }

    const loadCourses = (page) => {
        setLoading(true)
        ApiService.getFinishedCourses(student.id, page).then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setCourses(resp.data)
                setPrevPage(page == 2)
                setNextPage(page < 2)
            }
            setLoading(false)
        });
    }

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
        ApiService.addFinishedCourse(student.id, courseToAdd).then((data) => {
            switchAddModal()
            setCourseToAdd()
            loadCourses(page)
            setLoading(false)
        });
    }

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getPrograms(student.university.id, inputValue).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK && resp.status !== CREATED)
                    findError = resp.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(resp.data)
                }
            })
        })
    }

    const loadRemainingCoursesOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getRemainingCoursesProgram(student, selectedProgram, inputValue).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError) {
                    setError(true)
                    setStatus(findError)
                    callback([])
                } else {
                    callback(resp.data)
                }
            })
        })
    }

    if (loading === true || student === null)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            {
                <>
                    <CourseList key="course-list" reloadCourses={() => loadCourses(page)} courses={courses}/>
                    <Pagination page={page} prevPage={prevPage} nextPage={nextPage} loadContent={changePage}/>
                </>
            }
            {
                <div key="div-prog">
                    <div className="mx-auto align-items-center plus-button-container clickable">
                        <i
                            className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                            onClick={() => switchAddModal()} data-testid="plus-button"
                        ></i>
                    </div>
                    <Modal show={showAddModal} onHide={() => switchAddModal()} className="color-warning text-black">
                        <Modal.Header closeButton>
                            <Modal.Title>{t('modal.addCourse')}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <AsyncSelect
                                aria-label="program-select"
                                className="text-black m-2"
                                placeholder={t('search.program')}
                                defaultOptions
                                getOptionLabel={e => e.code+' - '+e.name}
                                getOptionValue={e => e.id}
                                defaultValue = {{value:student.program.id, code: student.program.code, name: student.program.name}}
                                loadOptions={loadProgramOptions}
                                onChange={opt => onChangePrograms(opt.id)}
                            />
                            <AsyncSelect key={selectedProgram}
                                aria-label="course-select"
                                className="text-black m-2"
                                placeholder={t('forms.course')}
                                cacheOptions
                                defaultOptions
                                noOptionsMessage={(inputValue) => {
                                    if(inputValue.inputValue.length > 0)
                                        return t('selectNoResults')
                                    return t('modal.noRemainingCoursesProgram')
                                }}
                                getOptionLabel={e => e.code+' - '+e.name}
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
