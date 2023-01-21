import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row } from 'react-bootstrap';
import CourseList from './CourseList';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { OK, CREATED } from '../../services/ApiConstants';
import ApiService from '../../services/ApiService';
import Pagination from '../Pagination'

function StudentCoursesList(props){
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true);
    const [courses,setCourses] = useState(props.course);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = props.user;

    const [prevPage, setPrevPage] = useState(false);
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState(false);
    const search = useLocation().search

    const readPageInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        let requestedPage = params.get('page')
        if(!requestedTab || requestedTab != "courses")
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
        navigate("?tab=courses&page="+newPage)
    }

    const redirectToCreate = () => {
        navigate('/courses/new');
    }

    const loadCourses = (page) => {
        setLoading(true)
        ApiService.getCoursesPage(user.id, page).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setCourses(data)
                setPrevPage(page == 2)
                setNextPage(page < 2)
            }
            setLoading(false)
        });
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <CourseList key="course-list" reloadCourses={() => loadCourses(page)} courses={courses}/>
            <Pagination page={page} prevPage={prevPage} nextPage={nextPage} loadContent={changePage}/>
            <div className="mx-auto align-items-center plus-button-container clickable">
                <i
                    className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                    onClick={() => redirectToCreate()}
                ></i>
            </div>
        </React.Fragment>
    );
}

export default StudentCoursesList;
