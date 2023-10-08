import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';
import { OK } from '../../services/ApiConstants';

function UniversityTermsList(props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [terms, setTerms] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [changingPublishStatus, setChangingPublishStatus] = useState([]);
    const [termToDelete, setTermToDelete] = useState();
    const [paginationLinks, setPaginationLinks] = useState(null);
    const [page, setPage] = useState(1);
    const search = useLocation().search

    useEffect(() => {
        const readPageInSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedTab = params.get('tab')
            const requestedPage = Number(params.get('page'))
            if(!requestedTab || requestedTab !== "terms" || !requestedPage)
                return 1
            return requestedPage
        }

        const requestedPage = readPageInSearchParams()
        if(!terms || requestedPage !== page){
            setPage(requestedPage)
            loadTerms(requestedPage)
        }
        // eslint-disable-next-line
    }, [search, page, terms])

    const changePage = (newPage) => {
        setPage(newPage)
        loadTerms(newPage)
        navigate("?tab=terms&page="+newPage)
    }

    const loadTerms = (page) => {
        setLoading(true)
        ApiService.getTerms(page).then((resp) => {
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
                setTerms(resp.data)
                setChangingPublishStatus(new Array(resp.data.length).fill(false))
            }
            setLoading(false)
        });
    }

    const redirectToEdit = (id) => {
        navigate("/terms/"+id)
    }

    const redirectToCreate = () => {
        navigate("/terms/new")
    }

    const switchTermStatus = async (index) => {
        const term = terms[index]
        const changingPublishStatusCopy = Object.assign({}, changingPublishStatus)
        changingPublishStatusCopy[index] = true
        setChangingPublishStatus(changingPublishStatusCopy)
        let resp
        if (term.published)
            resp = await ApiService.unpublishTerm(term)
        else
            resp = await ApiService.publishTerm(term)
        if (resp.status === OK)
            loadTerms(page)
        else{
            setError(true)
            setStatus(resp.status)
        }
    }

    const deleteTerm = async () => {
        if (!termToDelete) return;
        await ApiService.deleteTerm(termToDelete.id);
        closeDeleteModal()
        loadTerms(page)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setTermToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setTermToDelete(e)
    }

    const convertDateFormat = (dateString) => {
        const date = new Date(dateString)
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const locale = (navigator.userLanguage || (navigator.languages && navigator.languages.length && navigator.languages[0]) || navigator.language || navigator.browserLanguage || navigator.systemLanguage)
        return date.toLocaleDateString(locale, options) // Undefined locale should use local
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <div className="pt-4">
                {terms && terms.length > 0
                    ? [
                          terms.map((entry, index) => (
                              <Row key={'row-' + index} xs={1} md={6} className="border-bottom border-grey list-row pb-3 my-3 justify-content-center">
                                  <div className="m-auto">{entry.internalId}</div>
                                  <div className="m-auto">{entry.name}</div>
                                  <div className="m-auto">{convertDateFormat(entry.startDate)}</div>
                                  <div className="d-flex m-auto justify-content-center">
                                      <i
                                          className="bi bi-pencil-fill btn btn-lg text-white"
                                          id={'edit-' + index}
                                          onClick={() => redirectToEdit(entry.id)}
                                      ></i>
                                      <i
                                          className="bi bi-trash-fill btn btn-lg text-white"
                                          id={'trash-' + index}
                                          onClick={() => openDeleteModal(entry)}
                                      ></i>
                                  </div>
                                  <div className="m-auto d-flex justify-content-center">
                                      {changingPublishStatus[index]
                                          ? [
                                                <div key={'spinner-' + index} className="mx-auto">
                                                    <Spinner animation="border" />
                                                </div>,
                                            ]
                                          : [
                                                entry.published
                                                    ? [
                                                          <Button
                                                              key={'button-hide-' + index}
                                                              className="btn-wrap-text"
                                                              variant="success"
                                                              onClick={() => switchTermStatus(index)}
                                                          >
                                                              {t('terms.hide')}
                                                          </Button>,
                                                      ]
                                                    : [
                                                          <Button
                                                              key={'button-publish-' + index}
                                                              className="btn-wrap-text"
                                                              variant="warning"
                                                              onClick={() => switchTermStatus(index)}
                                                          >
                                                              {t('terms.publish')}
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
            <div className="mx-auto align-items-center plus-button-container clickable">
                <i
                    className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                    onClick={() => redirectToCreate()}
                ></i>
            </div>
            <Modal
                show={showDeleteModal}
                onHide={() => closeDeleteModal()}
                className="color-warning text-black"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t('modal.deleteTerm')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                        {
                            termToDelete &&
                            t('modal.areYouSureTerm', {
                                code: termToDelete.internalId,
                                name: termToDelete.name,
                            })
                        }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="grey" onClick={() => closeDeleteModal()}>
                        {t('modal.cancel')}
                    </Button>
                    <Button variant="danger" onClick={() => deleteTerm(termToDelete)}>
                        {t('modal.delete')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

export default UniversityTermsList;
