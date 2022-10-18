import React from 'react';
import CourseList from './CourseList';
import { useNavigate } from "react-router-dom";

function StudentCoursesList(props){
    const navigate = useNavigate()

    const redirectToCreate = () => {
        navigate('/courses/new');
    }

    return (
        <React.Fragment>
            <CourseList key="course-list"/>
            <div className="mx-auto align-items-center plus-button-container clickable">
                <i
                    className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                    onClick={() => redirectToCreate()}
                ></i>
            </div>
        </React.Fragment>
    );
}

export default StudentCoursesList;
