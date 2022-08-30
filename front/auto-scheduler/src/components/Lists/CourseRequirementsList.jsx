import React, { useState, useEffect } from 'react';
import { Spinner, Row } from 'react-bootstrap';
import { Translation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';
import LinkButton from '../LinkButton';

function CourseRequirementsList(props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [course] = useState(props.course);
    const [courses,setCourses] = useState(null);

    // ComponentDidMount
    useEffect( () => {
        if (course){
            ApiService.getRequiredCourses(course.id).then((data) => {
                let findError = null;
                if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else{
                  setCourses(data)
                  setLoading(false)
                }
            });
        }
    },[course])

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>;
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <div className="pt-4">
                {courses && courses.length > 0 ? [
                    courses.map((entry, index) => (
                        <Row key={'row-' + index} xs={1} md={4} className="px-5 mx-5 py-3 justify-content-center">
                            <div className={'my-auto ' + (window.innerWidth > 770 ? 'text-end' : '')}>
                                {entry.internalId}
                            </div>
                            <div className={'my-auto w-min-50 ' + (window.innerWidth > 770 ? 'text-start' : '')}>
                                <a className="text-white" href={'/courses/' + entry.id}>{entry.name}</a>
                            </div>
                          </Row>
                    )),
                  ]
                : [<div key="empty-list"><Translation>{(t) => t('noRequiredCourses')}</Translation></div>,]}
            </div>
            <LinkButton className="my-3" variant="secondary" href={'/courses/' + course.id + '/edit'} textKey="edit"/>
        </React.Fragment>
    );
}

export default CourseRequirementsList;
