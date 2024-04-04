import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Form, Button } from 'react-bootstrap';
import CourseList from './CourseList';
import { useLocation, useNavigate } from "react-router-dom";
import { OK } from '../../resources/ApiConstants';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';

function StudentCoursesList(props){
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useLocation().search

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState()

    const [courses,setCourses] = useState(props.course)

    const [paginationLinks, setPaginationLinks] = useState(null)
    const [page, setPage] = useState(1)
    const [filter, setFilter] = useState()

    const MIN_DISPLAYED_COURSE_AMOUNT_FOR_SEARCH_ACTIVATION = 5

    useEffect(() => {
        const readPageInSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedTab = params.get('tab')
            const requestedPage = Number(params.get('page')??1)
            if(!requestedTab || requestedTab !== "courses" || !requestedPage)
                return 1
            return requestedPage
        }

        const readFilterInSearchParams = () => {
            const params = new URLSearchParams(search)
            return params.get('filter')
        }

        const requestedPage = readPageInSearchParams()
        const requestedFilter = readFilterInSearchParams()
        if(!loading && !error && !courses || requestedPage !== page || requestedFilter !== filter){
            setLoading(true)
            setPage(requestedPage)
            setFilter(requestedFilter)
            loadCourses(requestedPage, requestedFilter)
        }
    }, [search, courses, page, loading, error, filter])

    const changePage = (newPage) => {
        setPage(newPage)
        loadCourses(newPage, filter)
        navigate("?tab=courses&page="+newPage +(filter?"&filter="+filter:""))
    }

    const redirectToCreate = () => {
        navigate('/courses/new')
    }

    const filterList = e => {
        e.preventDefault()
        navigate('/?tab=courses&filter='+e.target.textFilter.value)
    }

    const loadCourses = (page, textFilter) => {
        setLoading(true)
        ApiService.getCoursesPage(page, textFilter).then(resp => {
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

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            {
                courses && (courses.length > MIN_DISPLAYED_COURSE_AMOUNT_FOR_SEARCH_ACTIVATION || (paginationLinks && paginationLinks.last > 1 || filter)) &&
                <div className="pt-5 px-5">
                    <Form className="d-flex" onSubmit={filterList}>
                        <Form.Control
                          type="search"
                          name="textFilter"
                          placeholder={t("search.search")}
                          className="me-2"
                          aria-label="Search"
                        />
                        <Button variant="outline-secondary" type="submit">{t("search.submit")}</Button>
                    </Form>
                    { filter && <p className="pt-2">{t("search.showingResultsFor", {searchTerm:filter})}</p> }
                </div>
            }
            <CourseList key="course-list" reloadCourses={() => loadCourses(page, filter)} courses={courses}/>
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
