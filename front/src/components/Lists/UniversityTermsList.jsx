import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import ErrorMessage from '../Common/ErrorMessage';
import { OK, CREATED } from '../../services/ApiConstants';

function UniversityTermsList(props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const user = props.user;
    const [terms, setTerms] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [changingPublishStatus, setChangingPublishStatus] = useState([]);
    const [termToDelete, setTermToDelete] = useState();
    const [prevPage, setPrevPage] = useState(false);
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState(false);
    const search = useLocation().search

    const readPageInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        let requestedPage = params.get('page')
        if(!requestedTab || requestedTab != "terms")
            return null
        if(!requestedPage)
            requestedPage = 1
        return requestedPage
    }

    useEffect(() => {
        let requestedPage = readPageInSearchParams()
        if(!requestedPage)
            requestedPage = 1
        if(!terms || requestedPage != page){
            setPage(requestedPage)
            loadTerms(requestedPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation().search])

    const changePage = (newPage) => {
        setPage(newPage)
        loadTerms(newPage)
        navigate("?tab=terms&page="+newPage)
    }

    const loadTerms = (page) => {
        setLoading(true)
        ApiService.getTerms(user.id, page).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setTerms(data)
                setPrevPage(page == 2)
                setNextPage(page < 2)
                setChangingPublishStatus(new Array(data.length).fill(false))
            }
            setLoading(false)
        });
    }

    const redirectToEdit = (id) => {
        navigate("/terms/"+id);
    }

    const redirectToCreate = () => {
        navigate("/terms/new");
    }

    const switchTermStatus = async (index) => {
        const term = terms[index];
        const changingPublishStatusCopy = Object.assign({}, changingPublishStatus)
        changingPublishStatusCopy[index] = true;
        setChangingPublishStatus(changingPublishStatusCopy)
        let resp;
        if (term.published)
            resp = await ApiService.unpublishTerm(term);
        else
            resp = await ApiService.publishTerm(term);
        if (resp.status === OK)
            loadTerms();
        else{
            setError(true)
            setStatus(resp.status)
        }
    }

    const deleteTerm = () => {
        if (!termToDelete) return;
        ApiService.deleteTerm(termToDelete);
        closeDeleteModal()
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setTermToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setTermToDelete(e)
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
                                  <div className="m-auto">{entry.startDate}</div>
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
                                  <div className="my-auto p-0 d-flex justify-content-center">
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
            <Pagination page={page} prevPage={prevPage} nextPage={nextPage} loadContent={changePage}/>
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
