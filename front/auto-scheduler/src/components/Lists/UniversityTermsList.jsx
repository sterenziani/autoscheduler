import React, { Component } from 'react';
import {Button, Modal, Spinner, Row} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';

class UniversityTermsList extends Component {
  state = {
    loading: true,
    error: false,
    showDeleteModal: false,
    user: this.props.user,
    terms: null
  }

  componentDidMount() {
    this.loadTerms()
  }

  loadTerms(){
    console.log("LOADING")
    ApiService.getTerms(this.state.user.id).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED)
        findError = data.status;
      if(findError)
        this.setState({loading: false, error: true, status: findError});
      else
        this.setState({terms: data, loading: false});
    });
  }

  redirectToEdit(id){
    console.log("Redirect to /terms/"+id)
  }

  redirectToCreate(){
    console.log("Redirect to /terms/new")
  }

  async switchTermStatus(term){
    this.setState({loading: true});
    let resp;
    if(term.published)
      resp = await ApiService.unpublishTerm(term);
    else
      resp = await ApiService.publishTerm(term);
    if(resp.status == OK)
      this.loadTerms()
    else
      this.setState({error:true, status:resp.status, loading: false});
  }

  deleteTerm(){
    if(!this.state.termToDelete)
      return;
    ApiService.deleteTerm(this.state.termToDelete)
    let termsCopy = Object.assign({}, this.state).terms;
    this.setState({terms: termsCopy, showDeleteModal: !this.state.showDeleteModal, termToDelete: {}});
  }

  switchDeleteModal(){
    this.setState({ showDeleteModal: !this.state.showDeleteModal, termToDelete: {}});
  }

  switchDeleteModalParam(e){
    this.setState({ showDeleteModal: !this.state.showDeleteModal, termToDelete: e});
  }

  render(){
    if (this.state.loading === true)
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if(this.state.error)
      return <h1>ERROR {this.state.error}</h1>
    return (
      <React.Fragment>
        <div className="pt-4">
          { this.state.terms && this.state.terms.length>0?
            [
              this.state.terms.map((entry,index) => (
                <Row key={"row-"+index} xs={1} md={6} className="border-bottom border-grey list-row pb-3 mx-2 my-3 justify-content-center">
                  <div className="m-auto">{entry.internalId}</div>
                  <div className="m-auto">{entry.name}</div>
                  <div className="m-auto">{entry.startDate}</div>
                  <div className="d-flex m-auto justify-content-center">
                    <i className="bi bi-pencil-fill btn btn-lg text-white" id={"edit-"+index} onClick={() => {this.redirectToEdit(entry.id)}}></i>
                    <i className="bi bi-trash-fill btn btn-lg text-white" id={"trash-"+index} onClick={() => {this.switchDeleteModalParam(entry)}}></i>
                  </div>
                  <div className="my-auto p-0 d-flex justify-content-center">
                  {
                    entry.published? [
                        <Button key={"button-hide-"+index} className="btn-wrap-text" variant="success" onClick={() => {this.switchTermStatus(entry)}}>
                          <Translation>{t => t("terms.hide")}</Translation>
                        </Button>] : [
                        <Button key={"button-publish-"+index} className="btn-wrap-text" variant="warning" onClick={() => {this.switchTermStatus(entry)}}>
                          <Translation>{t => t("terms.publish")}</Translation>
                        </Button>
                      ]
                  }
                  </div>
                </Row>
              ))
            ] : [<div key="empty-list"><Translation>{t => t("emptyList")}</Translation></div>]
          }
        </div>
        <div className="mx-auto align-items-center plus-button-container clickable">
          <i className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big" onClick={() => {this.redirectToCreate()}}></i>
        </div>
        <Modal show={this.state.showDeleteModal} onHide={() => this.switchDeleteModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("modal.deleteTerm")}</Translation></Modal.Title>
          </Modal.Header>
          <Modal.Body><Translation>{t => t("modal.areYouSure", {code:this.state.termToDelete.internalId, name:this.state.termToDelete.name})}</Translation></Modal.Body>
          <Modal.Footer>
            <Button variant="grey" onClick={() => {this.switchDeleteModal()}}>
              <Translation>{t => t("modal.cancel")}</Translation>
            </Button>
            <Button variant="danger" onClick={() => {this.deleteTerm(this.state.termToDelete)}}>
              <Translation>{t => t("modal.delete")}</Translation>
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default UniversityTermsList;
