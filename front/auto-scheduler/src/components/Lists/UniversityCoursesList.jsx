import React, { Component } from 'react';
import {Translation} from "react-i18next";
import {Button, Modal} from 'react-bootstrap';
import CourseList from './CourseList'

class StudentCoursesList extends Component {
  state = {
    showDeleteModal: false,
    user: this.props.user
  }

  redirectToCreate(){
    console.log("Redirect to /courses/new")
  }

  render(){
    return (
      <React.Fragment>
        {
          this.state.user? [<CourseList key="course-list" user={this.state.user}/>] : []
        }
        <div className="mx-auto align-items-center plus-button-container clickable">
          <i className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big" onClick={() => {this.redirectToCreate()}}></i>
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

export default StudentCoursesList;
