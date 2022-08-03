import React, { Component } from 'react';
import {Button, Modal, Spinner} from 'react-bootstrap';
import {Translation} from "react-i18next";

class CourseList extends Component {
  state = {
    showModal: false,
    university: true,
    courses: [
      {id: '93.26', internalId: '93.26', name: 'Análisis Matemático I'},
      {id: '93.58', internalId: '93.58', name: 'Algebra'},
      {id: '72.03', internalId: '72.03', name: 'Introducción a la Informática'}
    ]
  }

  onClickPencil(e){
  }

  onClickPlusSign(e){
    let coursesCopy = Object.assign({}, this.state.courses);
    // TO DO: if University, go to Create
    // TO DO: if Student, add to list
    this.setState({courses: coursesCopy});
  }

  deleteCourse(){
    if(!this.state.courseToDelete)
      return;
    console.log("Requesting deletion of course "+this.state.courseToDelete.internalId)
    let coursesCopy = Object.assign({}, this.state).courses;
    coursesCopy.forEach((entry, index) => {
      if(entry.id === this.state.courseToDelete.id)
        coursesCopy.splice(index, 1);
    })
    this.setState({courses: coursesCopy, showModal: !this.state.showModal, courseToDelete: {}});
  }

  switchModal(){
    this.setState({ showModal: !this.state.showModal,
                    courseToDelete: {}});
  }

  switchModalParam(e){
    this.setState({ showModal: !this.state.showModal,
                    courseToDelete: e});
  }

  render(){
    return (
      <React.Fragment>
        <div className="pt-4">
          { this.state.courses && this.state.courses.length>0?
            [
              this.state.courses.map((entry,index) => (
                <div key={index} className="row">
                  <div className="col-2 m-auto">{entry.internalId}</div>
                  <div className="col-6 m-auto">{entry.name}</div>
                  {
                    this.state.university? [
                    <div key={"pencil-div-"+index} className="col-2 m-auto">
                      <i className="bi bi-pencil-fill btn btn-lg color-white" id={"edit-"+index} onClick={this.onClickPencil.bind(this)}></i>
                    </div>]:[]
                  }
                  <div className="col-2 m-auto"><i className="bi bi-trash-fill btn btn-lg color-white" id={"trash-"+index} onClick={() => {this.switchModalParam(entry)}}></i></div>
                </div>
              ))
            ] : [<div><Translation>{t => t("emptyList")}</Translation></div>]
          }
        </div>
        <Modal show={this.state.showModal} onHide={() => this.switchModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("modal.deleteCourse")}</Translation></Modal.Title>
          </Modal.Header>
          <Modal.Body><Translation>{t => t("modal.areYouSure", {code:this.state.courseToDelete.internalId, name:this.state.courseToDelete.name})}</Translation></Modal.Body>
          <Modal.Footer>
            <Button variant="grey" onClick={() => {this.switchModal()}}>
              <Translation>{t => t("modal.cancel")}</Translation>
            </Button>
            <Button variant="danger" onClick={() => {this.deleteCourse(this.state.courseToDelete)}}>
              <Translation>{t => t("modal.confirm")}</Translation>
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default CourseList;
