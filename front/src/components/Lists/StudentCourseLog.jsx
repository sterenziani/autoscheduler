import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { Button, Modal, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK } from '../../services/ApiConstants';
import CourseList from './CourseList';
import AsyncSelect from 'react-select/async'
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';


function StudentCourseLog(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [courses, setCourses] = useState(null)
    const [error, setError] = useState(false)
    const [status, setStatus] = useState(null)
    const student = props.student;

    const [paginationLinks, setPaginationLinks] = useState(null)
    const [page, setPage] = useState(1)
    const search = useLocation().search

    const [showAddModal,setShowAddModal] = useState(false)
    const [selectedProgramId,setselectedProgramId] = useState(student.program? student.program.id:undefined)
    const [courseToAdd,setCourseToAdd] = useState()

    useEffect(() => {
        const readPageInSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedTab = params.get('tab')
            const requestedPage = Number(params.get('page'))
            if(!requestedTab || requestedTab !== "finished_courses" || !requestedPage)
                return 1
            return requestedPage
        }

        const requestedPage = readPageInSearchParams()
        if(!courses || requestedPage !== page){
            setPage(requestedPage)
            loadCourses(requestedPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, courses, page])

    const changePage = (newPage) => {
        setPage(newPage)
        loadCourses(newPage)
        navigate("?tab=finished_courses&page="+newPage)
    }

    const loadCourses = (page) => {
        setLoading(true)
        ApiService.getFinishedCourses(page).then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                const links = ApiService.parsePagination(resp, page)
                setPaginationLinks(links)
                setCourses(resp.data)
            }
            setLoading(false)
        });
    }

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
    }

    const onChangePrograms = (programId) => {
        setselectedProgramId(programId)
        setCourseToAdd()
    }

    const onChangeCourseToAdd = (courseId) => {
        setCourseToAdd(courseId)
    }

    const addCourse = () => {
        if (!courseToAdd)
            return;
        setLoading(true)
        ApiService.addFinishedCourse(courseToAdd).then((data) => {
            switchAddModal()
            setCourseToAdd()
            loadCourses(page)
            setLoading(false)
        });
    }

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getPrograms(inputValue).then((resp) => {
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

    const loadRemainingCoursesOptions = (inputValue, callback) => {
        setTimeout(() => {
            if(!inputValue){
                callback([])
            } else {
                ApiService.getRemainingCoursesProgram(selectedProgramId, inputValue).then((resp) => {
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
            }
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
                    <Pagination page={page} links={paginationLinks} loadContent={changePage}/>
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
                                noOptionsMessage={() => t('selectNoResults')}
                                defaultValue = {student.program? {value:student.program.id, code: student.program.code, name: student.program.name}:undefined}
                                loadOptions={loadProgramOptions}
                                onChange={opt => onChangePrograms(opt.id)}
                            />
                            {
                                selectedProgramId &&
                                <AsyncSelect key={selectedProgramId}
                                    aria-label="course-select"
                                    className="text-black m-2"
                                    placeholder={t('forms.course')}
                                    cacheOptions
                                    defaultOptions
                                    noOptionsMessage={(inputValue) => {
                                        if(inputValue.inputValue.length > 0)
                                            return t('selectNoResults')
                                        return t('modal.inputTextToSearch')
                                    }}
                                    getOptionLabel={e => e.code+' - '+e.name}
                                    getOptionValue={e => e.id}
                                    loadOptions={loadRemainingCoursesOptions}
                                    onChange={opt => onChangeCourseToAdd(opt.id)}
                                />
                            }
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
