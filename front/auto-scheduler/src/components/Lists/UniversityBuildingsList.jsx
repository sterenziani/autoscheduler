import React, { Component } from 'react';
import {Button, Modal, Spinner, Row, Col, Card} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';

class UniversityBuildingsList extends Component {
  state = {
    loading: true,
    error: false,
    showDeleteModal: false,
    user: this.props.user,
    buildings: null
  }

  componentDidMount() {
    this.loadBuildings()
  }

  loadBuildings(){
    ApiService.getBuildings(this.state.user.id).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED)
        findError = data.status;
      if(findError)
        this.setState({loading: false, error: true, status: findError});
      else
        this.setState({buildings: data, loading: false});
    });
  }

  redirectToEdit(id){
    console.log("Redirect to /buildings/"+id)
  }

  redirectToCreate(){
    console.log("Redirect to /buildings/new")
  }

  deleteBuilding(){
    if(!this.state.buildingToDelete)
      return;
    ApiService.deleteBuilding(this.state.buildingToDelete)
    let buildingsCopy = Object.assign({}, this.state).buildings;
    this.setState({buildings: buildingsCopy, showDeleteModal: !this.state.showDeleteModal, buildingToDelete: {}});
  }

  switchDeleteModal(){
    this.setState({showDeleteModal: !this.state.showDeleteModal, buildingToDelete: {}});
  }

  switchDeleteModalParam(e){
    this.setState({showDeleteModal: !this.state.showDeleteModal, buildingToDelete: e});
  }

  render(){
    if (this.state.loading === true)
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if(this.state.error)
      return <h1>ERROR {this.state.error}</h1>
    return (
      <React.Fragment>
        <div className="pt-4">
          { this.state.buildings && this.state.buildings.length>0?
            [
              <div key="buildings-list" className="my-3 container">
                <Row xs={1} md={2} lg={3} className="g-4 m-auto justify-content-center">
                {
                  this.state.buildings.map((entry,index) => (
                    <Card key={"card-"+index} className="m-3 p-0">
                      <Card.Header className="bg-white text-primary text-start py-0 pe-0 me-0">
                        <div className="d-flex ms-1">
                          <div className="text-start my-auto me-auto">
                            <Card.Title className="m-0 h6">{entry.internalId+" - "+entry.name}</Card.Title>
                          </div>
                          <div className="d-flex my-auto text-center">
                            <i className="bi bi-pencil-fill btn btn-lg" id={"edit-"+index} onClick={() => {this.redirectToEdit(entry.id)}}></i>
                            <i className="bi bi-trash-fill btn btn-lg" id={"trash-"+index} onClick={() => {this.switchDeleteModalParam(entry)}}></i>
                          </div>
                        </div>
                      </Card.Header>
                      <Card.Body className="bg-grey text-black">
                      {
                        entry.distances.map((b, bidx) => (
                          <Row key={"row-"+index+"-"+bidx}>
                            <Col className="text-end">{b.building.name}</Col>
                            <Col className="text-start"><Translation>{t => t("minutes", {"minutes": b.time})}</Translation></Col>
                          </Row>
                        ))
                      }
                      </Card.Body>
                    </Card>
                  ))
                }
                </Row>
              </div>
            ] : [<div key="empty-list"><Translation>{t => t("emptyList")}</Translation></div>]
          }
        </div>
        <div className="mx-auto align-items-center plus-button-container clickable">
          <i className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big" onClick={() => {this.redirectToCreate()}}></i>
        </div>
        <Modal show={this.state.showDeleteModal} onHide={() => this.switchDeleteModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("modal.deleteBuilding")}</Translation></Modal.Title>
          </Modal.Header>
          <Modal.Body><Translation>{t => t("modal.areYouSure", {code:this.state.buildingToDelete.internalId, name:this.state.buildingToDelete.name})}</Translation></Modal.Body>
          <Modal.Footer>
            <Button variant="grey" onClick={() => {this.switchDeleteModal()}}>
              <Translation>{t => t("modal.cancel")}</Translation>
            </Button>
            <Button variant="danger" onClick={() => {this.deleteBuilding(this.state.buildingToDelete)}}>
              <Translation>{t => t("modal.delete")}</Translation>
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default UniversityBuildingsList;
