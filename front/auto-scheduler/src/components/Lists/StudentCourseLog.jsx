import React, { Component } from 'react';
import {Translation} from "react-i18next";
import {Button, Modal, Form, Spinner} from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';
import CourseList from './CourseList'

class StudentCourseLog extends Component {
  state = {
    university: true,
    user: null,
    programs: [],
    selectedProgram: {},
    courses: [],
    courseToAdd: "",
    loading: true,
    showAddModal: false
  }

  componentDidMount() {
    ApiService.getActiveUser().then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED) {
        findError = data.status;
      }
      if(findError) {
        this.setState({
          loading: false,
          error: true,
          status: findError,
        });
      }
      else {
        this.setState({ user: data });
        this.loadPrograms(data.university.id)
      }
    });
  }

  loadPrograms(university){
    ApiService.getPrograms(university).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED) {
        findError = data.status;
      }
      if(findError) {
        this.setState({
          loading: false,
          error: true,
          status: findError,
        });
      }
      else {
        this.setState({programs: data, selectedProgram: this.state.user.program.id});
        this.loadCourses(data[0].id)
      }
    });
  }

  loadCourses(selectedProgram){
    ApiService.getRemainingCoursesProgram(this.state.user, selectedProgram).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED) {
        findError = data.status;
      }
      if(findError) {
        this.setState({
          loading: false,
          error: true,
          status: findError,
        });
      }
      else {
        this.setState({
          selectedProgram: selectedProgram,
          courses: data,
          courseToAdd: data.length>0? data[0].id : null,
          loading: false,
        });
      }
    });
  }

  switchAddModal(){
    this.setState({showAddModal: !this.state.showAddModal});
  }

  onChangePrograms(e){
    var selectedProgram = e.target.value
    this.loadCourses(selectedProgram)
  }

  onChangeCourseToAdd(e){
    this.setState({courseToAdd: e.target.value});
  }

  addCourse(){
    if(!this.state.courseToAdd || this.state.courseToAdd === "")
      return;
    this.setState({ loading: true, });
    ApiService.addFinishedCourse(this.state.user, this.state.courseToAdd).then((data) => {
      this.switchAddModal()
      this.loadCourses(this.state.selectedProgram)
    });
  }

  render(){
    if(this.state.loading === true)
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if(this.state.error)
      return <h1>ERROR {this.state.error}</h1>
    return (
      <React.Fragment>
        {
          this.state.user? [<CourseList key={"list"} user={this.state.user}/>] : []
        }
        {
          this.state.programs? [
            <div key="div-prog">
            <div className="mx-auto align-items-center plus-button-container clickable">
              <i className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big" onClick={() => {this.switchAddModal()}}></i>
            </div>
            <Modal show={this.state.showAddModal} onHide={() => this.switchAddModal()} className="color-warning text-black">
              <Modal.Header closeButton>
                <Modal.Title><Translation>{t => t("modal.addCourse")}</Translation></Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Select value={this.state.selectedProgram} onChange={this.onChangePrograms.bind(this)} className="m-2">
                  { this.state.programs.map(p => (<option key={p.id} value={p.id}>{p.internalId+" - "+p.name}</option>)) }
                </Form.Select>
                {
                  this.state.courses && this.state.courses.length>0?
                  [<Form.Select key="course-select" value={this.state.courseToAdd} onChange={this.onChangeCourseToAdd.bind(this)} className="m-2">
                    {this.state.courses.map(c => (<option key={c.id} value={c.id}>{c.internalId+" - "+c.name}</option>))}
                  </Form.Select>] : [<div className="text-center" key="no-courses-message"><Translation>{t => t("modal.noRemainingCourses")}</Translation></div>]
                }
              </Modal.Body>
              <Modal.Footer>
                <Button variant="grey" onClick={() => {this.switchAddModal()}}>
                  <Translation>{t => t("modal.cancel")}</Translation>
                </Button>
                {
                  this.state.courseToAdd&&this.state.courseToAdd!==""? [
                    <Button key="enabled-add" variant="secondary" onClick={() => {this.addCourse(this.state.courseToAdd)}}>
                      <Translation>{t => t("modal.add")}</Translation>
                    </Button>
                  ] : [
                    <Button key="disabled-add" disabled variant="grey" onClick={() => {this.addCourse(this.state.courseToAdd)}}>
                      <Translation>{t => t("modal.add")}</Translation>
                    </Button>
                  ]
                }
              </Modal.Footer>
            </Modal>
            </div>
          ] : []
        }
      </React.Fragment>
    );
  }
}

export default StudentCourseLog;
