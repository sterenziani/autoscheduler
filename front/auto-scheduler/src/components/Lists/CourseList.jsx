import React, { Component } from 'react';
import {Button, Modal, Spinner, Row} from 'react-bootstrap';
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

  componentDidMount(){
    this.loadCourses()
  }

  redirectToEdit(id){
    console.log("Redirect to /courses/"+id+"/edit")
  }

  loadCourses(){
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
    else if(this.state.user.type === "university"){
      ApiService.getCourses(this.state.user.id).then((data) => {
        let findError = null;
        if (data && data.status && data.status !== OK && data.status !== CREATED)
          findError = data.status;
        if(findError)
          this.setState({loading: false, error: true, status: findError});
        else{
          this.setState({courses: data, loading: false});
        }
      });
    }
  }

  deleteCourse(){
    if(!this.state.courseToDelete)
      return;
    if(this.state.user.type === "student")
      ApiService.deleteFinishedCourse(this.state.user, this.state.courseToDelete.id)
    else if(this.state.user.type === "university")
      ApiService.deleteCourse(this.state.courseToDelete)
    let coursesCopy = Object.assign({}, this.state).courses;
    this.setState({courses: coursesCopy, showDeleteModal: !this.state.showDeleteModal, courseToDelete: {}});
    this.loadCourses();
  }

  switchDeleteModal(){
    this.setState({ showDeleteModal: !this.state.showDeleteModal, courseToDelete: {}});
  }

  switchDeleteModalParam(e){
    this.setState({ showDeleteModal: !this.state.showDeleteModal, courseToDelete: e});
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
                <Row key={"row-"+index} xs={1} md={4} className="border-bottom border-grey list-row px-5 pb-2 pt-3 justify-content-center">
                  <div className="my-auto">{entry.internalId}</div>
                  <div className="my-auto w-min-50">
                  {
                    this.state.user.type==="university"? [<a key={"link-"+entry.id} className="text-white" href={"/courses/"+entry.id}>{entry.name}</a>] : [<div key={"nada-"+entry.id}>{entry.name}</div>]
                  }
                  </div>
                  <div className="d-flexmy-auto justify-content-center">
                  {
                    this.state.user.type==="university"? [
                    <i key={"pencil-"+index} className="bi bi-pencil-fill btn btn-lg text-white" id={"edit-"+index} onClick={() => {this.redirectToEdit(entry.id)}}></i>]:[]
                  }
                    <i className="bi bi-trash-fill btn btn-lg text-white" id={"trash-"+index} onClick={() => {this.switchDeleteModalParam(entry)}}></i>
                  </div>
                </Row>
              ))
            ] : [<div key="empty-list"><Translation>{t => t("emptyList")}</Translation></div>]
          }
        </div>
        <Modal show={this.state.showDeleteModal} onHide={() => this.switchDeleteModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("modal.deleteCourse")}</Translation></Modal.Title>
          </Modal.Header>
          <Modal.Body><Translation>{t => t("modal.areYouSureCourse", {code:this.state.courseToDelete.internalId, name:this.state.courseToDelete.name})}</Translation></Modal.Body>
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
