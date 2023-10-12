import React, { useState, useEffect } from 'react';
import { Button, Spinner, Row } from 'react-bootstrap';
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';
import { OK } from '../../services/ApiConstants';

function UniversityUsersList(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useLocation().search

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState()

    const [universities, setUniversities] = useState(null)
    const [changingVerificationStatus, setChangingVerificationStatus] = useState([])

    const [paginationLinks, setPaginationLinks] = useState(null)
    const [filter, setFilter] = useState()
    const [page, setPage] = useState(1)

    useEffect(() => {
        const readSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedFilter = params.get('filter')
            const requestedPage = Number(params.get('page')??1)
            return {page: requestedPage, filter: requestedFilter}
        }

        const requests = readSearchParams()
        if((!loading && !error && !universities) || requests.page !== page || requests.filter !== filter){
            setLoading(true)
            setFilter(requests.filter)
            setPage(requests.page)
            loadUniversities(requests.page, requests.filter)
        }
    }, [search, page, filter, universities, loading, error])

    const changePage = (newPage) => {
        setPage(newPage)
        loadUniversities(newPage, filter)
        const url = `?page=${newPage}` + ((filter)?`&filter=${filter}`:"")
        navigate(url)
    }

    const loadUniversities = (page, filter) => {
        setLoading(true)
        ApiService.getUniversityUsersPage(page, filter).then((resp) => {
            if (resp && resp.status && resp.status !== OK)
                setError(resp.status)
            else{
                const links = ApiService.parsePagination(resp, page)
                setPaginationLinks(links)
                setUniversities(resp.data)
                setChangingVerificationStatus(new Array(resp.data.length).fill(false))
            }
            setLoading(false)
        });
    }

    const switchUniversityStatus = async (index) => {
        const university = universities[index]
        const changingVerificationStatusCopy = Object.assign({}, changingVerificationStatus)
        changingVerificationStatusCopy[index] = true
        setChangingVerificationStatus(changingVerificationStatusCopy)
        let resp
        if (university.verified)
            resp = await ApiService.unverifyUniversity(university.id)
        else
            resp = await ApiService.verifyUniversity(university.id)
        if (resp.status === OK)
            loadUniversities(page, filter)
        else
            setError(resp.status)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            <div className="pt-4">
                {universities && universities.length > 0
                    ? [
                          universities.map((entry, index) => (
                              <Row key={'row-' + index} xs={1} md={6} className="border-bottom border-grey list-row pb-3 my-3 justify-content-center">
                                  <div className="m-auto text-break">{entry.id}</div>
                                  <div className="m-auto fw-bold">{entry.name}</div>
                                  <div className="m-auto d-flex justify-content-center">
                                      {changingVerificationStatus[index]
                                          ? [
                                                <div key={'spinner-' + index} className="mx-auto">
                                                    <Spinner animation="border" />
                                                </div>,
                                            ]
                                          : [
                                                entry.verified
                                                    ? [
                                                        <Button
                                                            key={'button-unverify-' + index}
                                                            variant="warning"
                                                            onClick={() => switchUniversityStatus(index)}
                                                            >
                                                            {t('home.unverify')}
                                                        </Button>,
                                                      ]
                                                    : [
                                                        <Button
                                                            key={'button-verify-' + index}
                                                            variant="success"
                                                            onClick={() => switchUniversityStatus(index)}
                                                            >
                                                            {t('home.verify')}
                                                        </Button>,
                                                      ],
                                            ]}
                                  </div>
                              </Row>
                          )),
                      ]
                    : [
                          <div key="empty-list">{t('emptyList')}</div>,
                      ]}
            </div>
            <Pagination page={page} links={paginationLinks} loadContent={changePage}/>
        </React.Fragment>
    );
}

export default UniversityUsersList;
