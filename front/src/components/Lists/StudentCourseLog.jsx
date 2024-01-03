import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Modal, Spinner, Form } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK } from '../../resources/ApiConstants';
import CourseList from './CourseList';
import FormAsyncSelect from '../Common/FormAsyncSelect';
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';


function StudentCourseLog(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [courses, setCourses] = useState(null)
    const [error, setError] = useState()
    const student = props.student

    const [paginationLinks, setPaginationLinks] = useState(null)
    const [page, setPage] = useState(1)
    const search = useLocation().search

    const [showAddModal,setShowAddModal] = useState(false)
    const [selectedProgramId,setselectedProgramId] = useState(student.program? student.program.id:undefined)
    const [courseToAdd,setCourseToAdd] = useState()

    const courseSelectRef = useRef(null);

    useEffect(() => {
        const readPageInSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedTab = params.get('tab')
            const requestedPage = Number(params.get('page')??1)
            if(!requestedTab || requestedTab !== "finished_courses" || !requestedPage)
                return 1
            return requestedPage
        }

        const requestedPage = readPageInSearchParams()
        if(!loading && !error && !courses || requestedPage !== page){
            setLoading(false)
            setPage(requestedPage)
            loadCourses(requestedPage)
        }
    }, [search, courses, page, loading, error])

    useEffect(() => {
        if(showAddModal)
            courseSelectRef.current?.focus();
    }, [showAddModal])

    const changePage = (newPage) => {
        setPage(newPage)
        loadCourses(newPage)
        navigate("?tab=finished_courses&page="+newPage)
    }

    const loadCourses = (page) => {
        setLoading(true)
        ApiService.getFinishedCourses(page).then((resp) => {
            if (resp && resp.status && resp.status !== OK)
                setError(resp.status)
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
                if (resp && resp.status && resp.status !== OK){
                    setError(resp.status)
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

    if (loading === true || student === null)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
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
                        <Form onSubmit={(e) => { e.preventDefault(); addCourse(courseToAdd) }}>
                        <Modal.Body>
                            <div data-testid="program-select">
                            <FormAsyncSelect
                                aria-label="program-select"
                                className="text-black m-2"
                                placeholder={t('search.program')}
                                defaultOptions
                                getOptionLabel={e => e.internalId+' - '+e.name}
                                getOptionValue={e => e.id}
                                noOptionsMessage={() => t('selectNoResults')}
                                defaultValue = {student.program? {value:student.program.id, internalId: student.program.internalId, name: student.program.name}:undefined}
                                loadOptions={loadProgramOptions}
                                onChange={opt => onChangePrograms(opt.id)}
                            />
                            </div>
                            {
                                selectedProgramId &&
                                <div data-testid="course-select">
                                    <FormAsyncSelect key={selectedProgramId} ref={courseSelectRef}
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
                                        getOptionLabel={e => e.internalId+' - '+e.name}
                                        getOptionValue={e => e.id}
                                        loadOptions={loadRemainingCoursesOptions}
                                        onChange={opt => onChangeCourseToAdd(opt.id)}
                                    />
                                </div>
                            }
                        </Modal.Body>
                        <Modal.Footer>
                        <Button variant="grey" onClick={() => {switchAddModal()}}>
                            {t('modal.cancel')}
                        </Button>
                        {courseToAdd && courseToAdd !== ''
                        ? [
                            <Button key="enabled-add" type="submit" variant="secondary">
                                {t('modal.add')}
                            </Button>
                        ]
                        : [
                            <Button key="disabled-add" disabled variant="grey">
                                {t('modal.add')}
                            </Button>
                        ]}
                        </Modal.Footer>
                        </Form>
                    </Modal>
                </div>
            }
        </React.Fragment>
    );
}

export default StudentCourseLog;
