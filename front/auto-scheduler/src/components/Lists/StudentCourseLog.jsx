import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';
import CourseList from './CourseList';

function StudentCourseLog(props) {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [user, setUser] = useState();

    const [showAddModal,setShowAddModal] = useState(false);
    const [programs,setPrograms] = useState([]);
    const [courses,setCourses] = useState([]);
    const [selectedProgram,setSelectedProgram] = useState();
    const [courseToAdd,setCourseToAdd] = useState();

    useEffect( () => {
        setLoading(true)
        async function execute() {
                await Promise.all([loadUser()]);
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        async function execute() {
            await Promise.all([loadPrograms(user.university.id)]);
        }
        if(user)
            execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    useEffect( () => {
        async function execute() {
            await Promise.all([loadCourses(selectedProgram)]);
            setLoading(false)
        }
        if(selectedProgram)
            execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProgram])

    const loadUser = async () => {
        ApiService.getActiveUser().then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setUser(data)
            }
        })
    }

    const loadPrograms = async (university) => {
        ApiService.getPrograms(university).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else {
                setPrograms(data)
                setSelectedProgram(user.program.id)
            }
        });
    }

    const loadCourses = async (selectedProgram) => {
        ApiService.getRemainingCoursesProgram(user, selectedProgram).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setSelectedProgram(selectedProgram)
                setCourses(data)
                setCourseToAdd(data.length > 0 ? data[0].id : null)
            }
            setLoading(false)
        });
    }

    const switchAddModal = () => {
        setShowAddModal(!showAddModal)
    }

    const onChangePrograms = (e) => {
        setSelectedProgram(e.target.value)
    }

    const onChangeCourseToAdd = (e) => {
        setCourseToAdd(e.target.value)
    }

    const addCourse = () => {
        if (!courseToAdd)
            return;
        setLoading(true)
        ApiService.addFinishedCourse(user, courseToAdd).then((data) => {
            switchAddModal();
            loadCourses(selectedProgram);
            setLoading(false)
        });
    }


    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            {user ? [<CourseList key={'list'} user={user} />] : []}
            {programs
                ? [
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
                                  <Form.Select value={selectedProgram} onChange={onChangePrograms} className="m-2">
                                      {programs.map((p) => (
                                          <option key={p.id} value={p.id}>
                                              {p.internalId + ' - ' + p.name}
                                          </option>
                                      ))}
                                  </Form.Select>
                                  {courses && courses.length > 0
                                      ? [
                                            <Form.Select key="course-select" value={courseToAdd} onChange={onChangeCourseToAdd} className="m-2">
                                                {courses.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.internalId + ' - ' + c.name}
                                                    </option>
                                                ))}
                                            </Form.Select>,
                                        ]
                                      : [
                                            <div className="text-center" key="no-courses-message">
                                                {t('modal.noRemainingCoursesProgram')}
                                            </div>,
                                        ]}
                              </Modal.Body>
                              <Modal.Footer>
                                  <Button variant="grey" onClick={() => {switchAddModal()}}>
                                      {t('modal.cancel')}
                                  </Button>
                                  {courseToAdd && courseToAdd !== ''
                                      ? [
                                            <Button key="enabled-add" variant="secondary" onClick={() => {addCourse(courseToAdd)}}>
                                                {t('modal.add')}
                                            </Button>,
                                        ]
                                      : [
                                            <Button key="disabled-add" disabled variant="grey" onClick={() => {addCourse(courseToAdd)}}>
                                                {t('modal.add')}
                                            </Button>,
                                        ]}
                              </Modal.Footer>
                          </Modal>
                      </div>,
                  ]
                : []}
        </React.Fragment>
    );
}

export default StudentCourseLog;
