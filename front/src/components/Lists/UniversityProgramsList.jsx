import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import { OK, CREATED } from '../../services/ApiConstants';

function UniversityProgramsList(props){
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const user = props.user;
    const [programs, setPrograms] = useState(null);
    const [programToDelete, setProgramToDelete] = useState();
    const [prevPage, setPrevPage] = useState(false);
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState(false);
    const search = useLocation().search

    const readPageInSearchParams = () => {
        const params = new URLSearchParams(search)
        const requestedTab = params.get('tab')
        let requestedPage = params.get('page')
        if(!requestedTab || requestedTab != "programs")
            return null
        if(!requestedPage)
            requestedPage = 1
        return requestedPage
    }

    useEffect(() => {
        let requestedPage = readPageInSearchParams()
        if(!requestedPage)
            requestedPage = 1
        if(!programs || requestedPage != page){
            setPage(requestedPage)
            loadPrograms(requestedPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation().search])

    const changePage = (newPage) => {
        setPage(newPage)
        loadPrograms(newPage)
        navigate("?tab=programs&page="+newPage)
    }

    const loadPrograms = (page) => {
        setLoading(true)
        ApiService.getProgramsPage(user.id, page).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setPrograms(data)
                setPrevPage(page == 2)
                setNextPage(page < 2)
            }
            setLoading(false)
        });
    }

    const redirectToEdit = (id) => {
        navigate('/programs/' + id);
    }

    const redirectToCreate = () => {
        navigate('/programs/new');
    }

    const deleteProgram = () => {
        if (!programToDelete)
            return;
        ApiService.deleteProgram(programToDelete);
        closeDeleteModal()
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setProgramToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setProgramToDelete(e)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <div className="pt-4">
                {programs && programs.length > 0
                    ? [
                          programs.map((entry, index) => (
                              <Row
                                  key={'row-' + index} xs={1} md={3}
                                  className="border-bottom border-grey list-row px-5 pb-2 pt-3 justify-content-center"
                              >
                                  <div className="my-auto w-50">
                                      <a className="text-white" href={'/programs/' + entry.id}>
                                          {entry.internalId + ' - ' + entry.name}
                                      </a>
                                  </div>
                                  <div className="d-flex my-auto justify-content-center">
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
            <Modal show={showDeleteModal} onHide={() => closeDeleteModal()} className="color-warning text-black">
                <Modal.Header closeButton>
                    <Modal.Title>{t('modal.deleteProgram')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        programToDelete &&
                        t('modal.areYouSureProgram', {
                            code: programToDelete.internalId,
                            name: programToDelete.name,
                        })
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="grey" onClick={() => closeDeleteModal()}>
                        {t('modal.cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => deleteProgram(programToDelete)}
                    >
                        {t('modal.delete')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

export default UniversityProgramsList;
