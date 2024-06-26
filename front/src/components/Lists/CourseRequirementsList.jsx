import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK } from '../../resources/ApiConstants';
import ErrorMessage from '../Common/ErrorMessage';
import { Link } from "react-router-dom";

function CourseRequirementsList(props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()
    const [requirements, setRequirements] = useState(null)

    useEffect( () => {
        if (props.course && props.program){
            ApiService.getRequiredCoursesForProgram(props.course.id, props.program.id).then((resp) => {
                if (resp && resp.status && resp.status !== OK)
                    setError(resp.status)
                else
                  setRequirements(resp.data)
                setLoading(false)
            });
        }
    },[props.course, props.program])

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
    if(!requirements || requirements.length === 0)
        return <div className="mt-3 mx-5 text-wrap">{t('noDefinedRequirements')}</div>
    return (
        <React.Fragment>
            <div className="pt-4">
            {
                requirements.map((entry, index) => (
                    <Row key={'row-' + index} className="px-5 mx-5 py-3 justify-content-center">
                        <Col className={'col-3 my-auto text-end'}>
                            {entry.internalId}
                        </Col>
                        <Col className={'text-center my-auto w-min-50 text-start'}>
                            <Link className="text-white" to={'/courses/' + entry.id}>{entry.name}</Link>
                        </Col>
                    </Row>
                ))
            }
            </div>
        </React.Fragment>
    );
}

export default CourseRequirementsList;
