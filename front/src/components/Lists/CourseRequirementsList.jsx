import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Row } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';

function CourseRequirementsList(props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const course = props.course;
    const [courses,setCourses] = useState(null);

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
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {status}</h1>
    if(!props.program || !props.program.id || !courses[props.program.id])
        return <div className="mt-3">{t('noDefinedRequirements')}</div>
    if(!courses || !courses[props.program.id] || courses[props.program.id].length <= 0)
        return <div className="mt-3">{t('noRequiredCourses')}</div>
    return (
        <React.Fragment>
            <div className="pt-4">
                {
                    courses[props.program.id].map((entry, index) => (
                        <Row key={'row-' + index} xs={1} md={4} className="px-5 mx-5 py-3 justify-content-center">
                            <div className={'my-auto ' + (window.innerWidth > 770 ? 'text-end' : '')}>
                                {entry.internalId}
                            </div>
                            <div className={'my-auto w-min-50 ' + (window.innerWidth > 770 ? 'text-start' : '')}>
                                <a className="text-white" href={'/courses/' + entry.id}>{entry.name}</a>
                            </div>
                          </Row>
                    ))
                }
            </div>
        </React.Fragment>
    );
}

export default CourseRequirementsList;
