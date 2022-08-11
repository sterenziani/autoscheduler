import React, { Component } from 'react';
import {Button, Modal, Spinner} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';

class CourseList extends Component {
  state = {
    loading: true,
    error: false,
    showDeleteModal: false,
    user: this.props.user,
    courses: null
  }

  componentDidUpdate() {
    if(this.state.user.type === "student"){
      ApiService.getFinishedCourses(this.state.user.name).then((data) => {
        let findError = null;
        if (data && data.status && data.status !== OK && data.status !== CREATED)
          findError = data.status;
        if(findError)
          this.setState({loading: false, error: true, status: findError});
        else
          this.setState({courses: data, loading: false});
      });
    }
  }

  onClickPencil(e){
  }

  deleteCourse(){
    if(!this.state.courseToDelete)
      return;
    if(this.state.user.type == "student")
      ApiService.deleteFinishedCourse(this.state.user, this.state.courseToDelete.id)
    else
      console.log("TO DO")
    let coursesCopy = Object.assign({}, this.state).courses;
    this.setState({courses: coursesCopy, showDeleteModal: !this.state.showDeleteModal, courseToDelete: {}});
  }

  switchDeleteModal(){
    this.setState({ showDeleteModal: !this.state.showDeleteModal,
                    courseToDelete: {}});
  }

  switchDeleteModalParam(e){
    this.setState({ showDeleteModal: !this.state.showDeleteModal,
                    courseToDelete: e});
  }

  render(){
    if (this.state.loading === true) {
      return  <div className="mx-auto py-3">
                <Spinner animation="border"/>
              </div>
    }
    if(this.state.error) {
      return <h1>ERROR {this.state.error}</h1>
    }
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
                    this.state.user.type==="university"? [
                    <div key={"pencil-div-"+index} className="col-2 m-auto">
                      <i className="bi bi-pencil-fill btn btn-lg color-white" id={"edit-"+index} onClick={this.onClickPencil.bind(this)}></i>
                    </div>]:[]
                  }
                  <div className="col-2 m-auto"><i className="bi bi-trash-fill btn btn-lg color-white" id={"trash-"+index} onClick={() => {this.switchDeleteModalParam(entry)}}></i></div>
                </div>
              ))
            ] : [<div key="empty-list"><Translation>{t => t("emptyList")}</Translation></div>]
          }
        </div>
        <Modal show={this.state.showDeleteModal} onHide={() => this.switchDeleteModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("modal.deleteCourse")}</Translation></Modal.Title>
          </Modal.Header>
          <Modal.Body><Translation>{t => t("modal.areYouSure", {code:this.state.courseToDelete.internalId, name:this.state.courseToDelete.name})}</Translation></Modal.Body>
          <Modal.Footer>
            <Button variant="grey" onClick={() => {this.switchDeleteModal()}}>
              <Translation>{t => t("modal.cancel")}</Translation>
            </Button>
            <Button variant="danger" onClick={() => {this.deleteCourse(this.state.courseToDelete)}}>
              <Translation>{t => t("modal.delete")}</Translation>
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

export default CourseList;
