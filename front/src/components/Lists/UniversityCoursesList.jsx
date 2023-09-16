import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import CourseList from './CourseList';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { OK, CREATED } from '../../services/ApiConstants';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';

function StudentCoursesList(props){
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true);
    const [courses,setCourses] = useState(props.course);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = props.user;

    const [paginationLinks, setPaginationLinks] = useState(null);
    const [page, setPage] = useState(1);
    const search = useLocation().search

    const readPageInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        const requestedPage = Number(params.get('page'))
        if(!requestedTab || requestedTab !== "courses" || !requestedPage)
            return 1
        return requestedPage
    }

    useEffect(() => {
        const requestedPage = readPageInSearchParams()
        if(!courses || requestedPage !== page){
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
        ApiService.getCoursesPage(user.id, page).then(resp => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK && resp.status !== CREATED)
                findError = resp.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                const links = ApiService.parsePagination(resp)
                setPaginationLinks(links)
                setCourses(resp.data)
            }
            setLoading(false)
        });
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <CourseList key="course-list" reloadCourses={() => loadCourses(page)} courses={courses}/>
            <Pagination page={page} links={paginationLinks} loadContent={changePage}/>
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
