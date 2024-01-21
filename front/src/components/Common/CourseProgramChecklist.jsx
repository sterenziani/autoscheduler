import React, { useState, useEffect } from 'react';
import { Spinner, Container, Col, Form} from 'react-bootstrap';
import { useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import ErrorMessage from '../Common/ErrorMessage';
import LinkButton from '../Common/LinkButton';
import { OK } from '../../resources/ApiConstants';

function CourseProgramChecklist(props){
    const { t } = useTranslation()
    const search = useLocation().search

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const [programs, setPrograms] = useState(null)

    useEffect(() => {
        const loadPrograms = () => {
            setLoading(true)
            ApiService.getPrograms().then((resp) => {
                if (resp && resp.status && resp.status !== OK)
                    setError(resp.status)
                else{
                    setPrograms(resp.data)
                    const programsData = {}
                    for(const p of resp.data){
                        programsData[p.id] = {
                            isIn: false,
                            isOptional: false,
                            requiredCredits: 0
                        }
                    }
                    props.setProgramsData(programsData)
                }
                setLoading(false)
            });
        }
        if(!error && !programs)
            loadPrograms()
    }, [search, programs, loading, error, props])

    const onChangeInProgram = (e) => {
        const programsDataCopy = Object.assign({}, props.programsData)
        const programId = e.target.getAttribute("programid")
        programsDataCopy[programId].isIn = e.target.checked
        props.setProgramsData(programsDataCopy)
    }

    const onChangeMandatory = (e) => {
        const programsDataCopy = Object.assign({}, props.programsData)
        const programId = e.target.getAttribute("programid")
        programsDataCopy[programId].isOptional = e.target.checked
        props.setProgramsData(programsDataCopy)
    }

    const onChangeRequiredCredits = (e) => {
        const newValue = e.target.value? parseInt(e.target.value) : 0
        const programsDataCopy = Object.assign({}, props.programsData);
        const programId = e.target.getAttribute("programid")
        programsDataCopy[programId].requiredCredits = newValue;
        props.setProgramsData(programsDataCopy)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>

    if(programs && programs.length === 0){
        return(<></>)
    }
    return (
        <React.Fragment>
            <Container className="pt-4 my-auto">
                <div className="d-flex border-bottom border-grey list-row px-5 pb-2 pt-3 justify-content-center fw-bold">
                    <Col xs={3} md={5} className="my-auto">{t('forms.programName')}</Col>
                    <Col className="my-auto">{t('forms.isCourseInProgram')}</Col>
                    <Col className="my-auto">{t('forms.isOptional')}</Col>
                    <Col className="my-auto">{t('forms.requiredCredits')}</Col>
                </div>
                {programs && programs.length > 0
                    ? [
                        programs.map((entry, index) => (
                            <div
                                key={'row-' + index}
                                className="border-bottom border-grey d-flex px-5 pb-2 pt-3 justify-content-center"
                            >
                                <Col xs={3} md={5} className="my-auto">{entry.internalId} - {entry.name}</Col>
                                <Col className="my-auto">
                                    <Form.Check
                                        id={'isIn'+entry.id}
                                        programid={entry.id}
                                        checked={props.programsData[entry.id].isIn}
                                        onChange={onChangeInProgram}
                                    />
                                </Col>
                                <Col className="my-auto">
                                    <Form.Check
                                        id={'mandatoryFor'+entry.id}
                                        programid={entry.id}
                                        checked={props.programsData[entry.id].isOptional}
                                        onChange={onChangeMandatory}
                                        disabled={!props.programsData[entry.id].isIn}
                                    />
                                </Col>
                                <Col className="my-auto">
                                    <Form.Control
                                        id={'requiredCreditsFor'+entry.id}
                                        programid={entry.id}
                                        type="number" min="0"
                                        value={props.programsData[entry.id].requiredCredits}
                                        onChange={onChangeRequiredCredits}
                                        disabled={!props.programsData[entry.id].isIn}
                                    />
                                </Col>
                            </div>
                        )),
                    ]
                    : [
                        <div key="empty-list">{t('emptyList')}</div>,
                    ]}
            </Container>
        </React.Fragment>
    );
}

export default CourseProgramChecklist;
