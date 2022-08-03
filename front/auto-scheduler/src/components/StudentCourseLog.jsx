import React, { Component } from 'react';
import CourseList from './CourseList'

class StudentCourseLog extends Component {
  state = {}

  onClickTrashCan(e){
    let paramsCopy = Object.assign({}, this.state.params);
    //paramsCopy.unavailableTimeSlots.splice(index, 1);
    this.setState({params: paramsCopy});
  }

  onClickPlusSign(e){
    let paramsCopy = Object.assign({}, this.state.params);
    this.setState({params: paramsCopy});
  }

  render(){
    return (
      <React.Fragment>
        <CourseList/>
        <div className="mx-auto align-items-center plus-button-container clickable">
          <i className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big" onClick={this.onClickPlusSign.bind(this)}></i>
        </div>
      </React.Fragment>
    );
  }
}

export default StudentCourseLog;
