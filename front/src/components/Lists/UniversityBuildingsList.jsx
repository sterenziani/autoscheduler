import React, { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Row } from 'react-bootstrap';
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import Pagination from '../Common/Pagination'
import { OK } from '../../services/ApiConstants';
import ErrorMessage from '../Common/ErrorMessage';

function UniversityBuildingsList(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useLocation().search

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState()

    const [buildings, setBuildings] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [buildingToDelete, setBuildingToDelete] = useState()

    const [paginationLinks, setPaginationLinks] = useState(null)
    const [page, setPage] = useState(1)

    useEffect(() => {
        const readPageInSearchParams = () => {
            const params = new URLSearchParams(search)
            const requestedTab = params.get('tab')
            const requestedPage = Number(params.get('page')??1)
            if(!requestedTab || requestedTab !== "buildings" || !requestedPage)
                return 1
            return requestedPage
        }

        const requestedPage = readPageInSearchParams()
        if(!loading && !error && !buildings || requestedPage !== page){
            setLoading(true)
            setPage(requestedPage)
            loadBuildings(requestedPage)
        }
    }, [search, buildings, page, loading, error])

    const changePage = (newPage) => {
        setPage(newPage)
        loadBuildings(newPage)
        navigate("?tab=buildings&page="+newPage)
    }

    const loadBuildings = (page) => {
        setLoading(true)
        ApiService.getBuildingsPage(page).then((resp) => {
            if (resp && resp.status && resp.status !== OK)
                setError(resp.status)
            else{
                const links = ApiService.parsePagination(resp, page)
                setPaginationLinks(links)
                setBuildings(resp.data)
            }
            setLoading(false)
        });
    }

    const redirectToEdit = (id) => {
        navigate('/buildings/' + id)
    }

    const redirectToCreate = () => {
        navigate("/buildings/new")
    }

    const deleteBuilding = async () => {
        if (!buildingToDelete)
            return;
        closeDeleteModal()
        await ApiService.deleteBuilding(buildingToDelete.id)
        loadBuildings(page)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setBuildingToDelete(undefined)
    }

    const openDeleteModal = (e) => {
        setShowDeleteModal(true)
        setBuildingToDelete(e)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            <div className="pt-4">
                {buildings && buildings.length > 0
                    ? [
                          buildings.map((entry, index) => (
                                    <Row
                                        key={'row-' + index} xs={1} md={4}
                                        className="border-bottom border-grey list-row px-5 pb-2 pt-3 justify-content-center"
                                    >
                                        <div className="my-auto">{entry.internalId}</div>
                                        <div className="my-auto w-min-50 text-white">
                                            {entry.name}
                                        </div>
                                        <div className="d-flexmy-auto justify-content-center">
                                            <i
                                                key={'pencil-' + index}
                                                className="bi bi-pencil-fill btn btn-lg text-white"
                                                id={'edit-' + index}
                                                onClick={() => redirectToEdit(entry.id)}
                                            ></i>
                                            <i
                                                className="bi bi-trash-fill btn btn-lg text-white"
                                                id={'trash-' + index}
                                                data-testid={'trash-' + index}
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
            <Pagination page={page} links={paginationLinks} loadContent={changePage}/>
            <div className="mx-auto align-items-center plus-button-container clickable">
                <i
                    className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                    onClick={() => redirectToCreate()}
                ></i>
            </div>
            <Modal show={showDeleteModal} onHide={() => closeDeleteModal()} className="color-warning text-black">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t('modal.deleteBuilding')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        buildingToDelete &&
                        t('modal.areYouSureBuilding', {
                            code: buildingToDelete.internalId,
                            name: buildingToDelete.name,
                        })
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="grey" onClick={() => closeDeleteModal()}>
                        {t('modal.cancel')}
                    </Button>
                    <Button variant="danger" onClick={() => deleteBuilding()}>
                        {t('modal.delete')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

export default UniversityBuildingsList;
