import React, { Component } from 'react';
import CourseList from './CourseList';

class StudentCoursesList extends Component {
    state = {
        user: this.props.user,
    };

    redirectToCreate() {
        console.log('Redirect to /courses/new');
    }

    render() {
        return (
            <React.Fragment>
                {this.state.user ? [<CourseList key="course-list" user={this.state.user} />] : []}
                <div className="mx-auto align-items-center plus-button-container clickable">
                    <i
                        className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                        onClick={() => {
                            this.redirectToCreate();
                        }}
                    ></i>
                </div>
            </React.Fragment>
        );
    }
}

export default StudentCoursesList;
