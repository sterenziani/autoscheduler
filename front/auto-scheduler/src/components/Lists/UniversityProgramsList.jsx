import React, { Component } from 'react';
import {Button, Modal, Spinner} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';

class UniversityProgramsList extends Component {
  state = {
    loading: true,
    error: false,
    showDeleteModal: false,
    user: this.props.user,
    programs: null
  }

  componentDidMount() {
    this.loadPrograms()
  }

  loadPrograms(){
    ApiService.getPrograms(this.state.user.id).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED)
        findError = data.status;
      if(findError)
        this.setState({loading: false, error: true, status: findError});
      else
        this.setState({programs: data, loading: false});
    });
  }

  redirectToEdit(id){
    console.log("Redirect to /programs/"+id)
  }

  redirectToCreate(){
    console.log("Redirect to /programs/new")
  }

  deleteProgram(){
    if(!this.state.programToDelete)
      return;
    ApiService.deleteProgram(this.state.programToDelete).then((data) => {
      console.log(data)
    })
    let programsCopy = Object.assign({}, this.state).programs;
    this.setState({programs: programsCopy, showDeleteModal: !this.state.showDeleteModal, programToDelete: {}});
  }

  switchDeleteModal(){
    this.setState({ showDeleteModal: !this.state.showDeleteModal, programToDelete: {}});
  }

  switchDeleteModalParam(e){
    console.log(e)
    this.setState({ showDeleteModal: !this.state.showDeleteModal, programToDelete: e});
  }

  render(){
    if (this.state.loading === true)
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if(this.state.error)
      return <h1>ERROR {this.state.error}</h1>
    return (
      <React.Fragment>
        <div className="pt-4">
          { this.state.programs && this.state.programs.length>0?
            [
              this.state.programs.map((entry,index) => (
                <div key={index} className="row">
                  <div className="col-2 m-auto"></div>
                  <div className="col-6 m-auto"><a className="text-white" href={"/programs/"+entry.id}>{entry.internalId+" - "+entry.name}</a></div>
                  <div className="col-1 m-auto"><i className="bi bi-pencil-fill btn btn-lg color-white" id={"edit-"+index} onClick={() => {this.redirectToEdit(entry.id)}}></i></div>
                  <div className="col-1 m-auto"><i className="bi bi-trash-fill btn btn-lg color-white" id={"trash-"+index} onClick={() => {this.switchDeleteModalParam(entry)}}></i></div>
                  <div className="col-2 m-auto"></div>
                </div>
              ))
            ] : [<div key="empty-list"><Translation>{t => t("emptyList")}</Translation></div>]
          }
        </div>
        <div className="mx-auto align-items-center plus-button-container clickable">
          <i className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big" onClick={() => {this.redirectToCreate()}}></i>
        </div>
        <Modal show={this.state.showDeleteModal} onHide={() => this.switchDeleteModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("modal.deleteProgram")}</Translation></Modal.Title>
          </Modal.Header>
          <Modal.Body><Translation>{t => t("modal.areYouSure", {code:this.state.programToDelete.internalId, name:this.state.programToDelete.name})}</Translation></Modal.Body>
          <Modal.Footer>
            <Button variant="grey" onClick={() => {this.switchDeleteModal()}}>
              <Translation>{t => t("modal.cancel")}</Translation>
            </Button>
            <Button variant="danger" onClick={() => {this.deleteProgram(this.state.programToDelete)}}>
              <Translation>{t => t("modal.delete")}</Translation>
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default UniversityProgramsList;