import React, { Component } from 'react';
import {Spinner, Row} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';
import LinkButton from '../LinkButton'

class CourseRequirementsList extends Component {
  state = {
    loading: true,
    error: false,
    course: this.props.course,
    requirements: null
  }

  componentDidMount(){
    this.loadRequiredCourses()
  }

  loadRequiredCourses(){
    if(this.props.course){
      ApiService.getRequiredCourses(this.state.course.id).then((data) => {
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
    if (this.state.loading === true)
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if(this.state.error)
      return <h1>ERROR {this.state.error}</h1>
    return (
      <React.Fragment>
        <div className="pt-4">
          { this.state.courses && this.state.courses.length>0?
            [
              this.state.courses.map((entry,index) => (
                <Row key={"row-"+index} xs={1} md={4} className="px-5 mx-5 py-3 justify-content-center">
                  <div className={"my-auto "+(window.innerWidth>770? "text-end":"")}>{entry.internalId}</div>
                  <div className={"my-auto w-min-50 "+(window.innerWidth>770? "text-start":"")}><a className="text-white" href={"/courses/"+entry.id}>{entry.name}</a></div>
                </Row>
              ))
            ] : [<div key="empty-list"><Translation>{t => t("noRequiredCourses")}</Translation></div>]
          }
        </div>
        <LinkButton className="my-3" variant="secondary" href={"/courses/"+this.state.course.id+"/edit"} textKey="edit"/>
      </React.Fragment>
    );
  }
}

export default CourseRequirementsList;
