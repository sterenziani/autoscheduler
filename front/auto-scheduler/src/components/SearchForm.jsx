import React, {useState, useEffect} from 'react';
import { Button, Form, Spinner, Row } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import ApiService from '../services/ApiService';
import { OK, CREATED } from '../services/ApiConstants';
import { DAYS, DEFAULT_DATE } from "../services/SystemConstants";

function SearchForm(props) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const user = ApiService.getActiveUser()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [terms, setTerms] = useState();
    const [programs, setPrograms] = useState();
    const [params, setParams] = useState({
        program: undefined, term: undefined, hours: 24,
        reduceDays: true, prioritizeUnlocks: true,
        unavailableTimeSlots: [JSON.parse(JSON.stringify(DEFAULT_DATE))]
    });

    const onChangePrograms = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.program = e.target.value;
        setParams(paramsCopy)
    }

    const onChangeTerms = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.term = e.target.value;
        setParams(paramsCopy)
    }

    const onChangeHours = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.hours = parseInt(e.target.value);
        setParams(paramsCopy)
    }

    const onChangePrioritize = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.prioritizeUnlocks = e.target.checked;
        setParams(paramsCopy)
    }

    const onChangeReduceDays = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.reduceDays = e.target.checked;
        setParams(paramsCopy)
    }

    const onChangeDay = (e) => {
        const paramsCopy = Object.assign({}, params);
        const index = e.target.id.match(/\d/g)[0];
        paramsCopy.unavailableTimeSlots[index].day = e.target.value;
        setParams(paramsCopy)
    }

    const onChangeStartTime = (e) => {
        const paramsCopy = Object.assign({}, params);
        const index = e.target.id.match(/\d/g)[0];
        paramsCopy.unavailableTimeSlots[index].startTime = e.target.value;
        setParams(paramsCopy)
    }

    const onChangeEndTime = (e) => {
        const paramsCopy = Object.assign({}, params);
        const index = e.target.id.match(/\d/g)[0];
        paramsCopy.unavailableTimeSlots[index].endTime = e.target.value;
        setParams(paramsCopy)
    }

    const onClickTrashCan = (e) => {
        const paramsCopy = Object.assign({}, params);
        const index = e.target.id.match(/\d/g)[0];
        paramsCopy.unavailableTimeSlots.splice(index, 1);
        setParams(paramsCopy)
    }

    const onClickPlusSign = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.unavailableTimeSlots.push(JSON.parse(JSON.stringify(DEFAULT_DATE)));
        setParams(paramsCopy)
    }

    const getPath = (studentName) => {
        let path = 'results';
        var prog = params.program ? params.program : programs[0];
        var term = params.term ? params.term : terms[0];
        path += '?program=' + prog;
        path += '&term=' + term;
        path += '&hours=' + params.hours;
        path += '&reduceDays=' + params.reduceDays;
        path += '&prioritizeUnlocks=' + params.prioritizeUnlocks;
        path += '&userAsking=' + studentName;
        if (params.unavailableTimeSlots) {
            params.unavailableTimeSlots.forEach((slot) => {
                if (slot.startTime < slot.endTime)
                    path += '&unavailable=' + slot.day + '-' + slot.startTime + '-' + slot.endTime;
            });
        }
        return path;
    }

    useEffect( () => {
        if(!user)
            navigate("/register")
        loadProgramsAndTerms(user.university.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadProgramsAndTerms = (university) => {
        ApiService.getPrograms(university).then((dataProg) => {
            let findError = null;
            if (dataProg && dataProg.status && dataProg.status !== OK && dataProg.status !== CREATED)
                findError = dataProg.status;
            if (findError) {
                setError(true)
                setStatus(findError)
                setLoading(false)
            } else {
                ApiService.getTerms(university).then((dataTerm) => {
                    let findError = null;
                    if (dataTerm && dataTerm.status && dataTerm.status !== OK && dataTerm.status !== CREATED)
                        findError = dataTerm.status;
                    if (findError) {
                        setError(true)
                        setStatus(findError)
                    }
                    else {
                        const paramsCopy = Object.assign({}, params);
                        paramsCopy.program = dataProg[0].id;
                        paramsCopy.term = dataTerm[0].id;
                        setPrograms(dataProg)
                        setTerms(dataTerm)
                        setParams(paramsCopy)
                    }
                    setLoading(false)
                });
            }
        });
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <h1>ERROR {error}</h1>
    return (
        <React.Fragment>
            <Form className="p-3 mx-auto text-center color-white">
                <Form.Group controlId="program" className="row mx-auto form-row">
                    <div className="col-4 text-end my-auto text-break">
                        <Form.Label className="my-0">
                            <h5 className="my-0">
                                <strong>
                                    {t('search.program')}
                                </strong>
                            </h5>
                        </Form.Label>
                    </div>
                    <div className="col-8 text-center">
                        <Form.Select value={params.program} onChange={onChangePrograms}>
                            {programs.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.internalId + ' - ' + p.name}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                </Form.Group>

                <Form.Group controlId="term" className="row mx-auto form-row">
                    <div className="col-4 text-end my-auto text-break">
                        <Form.Label className="my-0">
                            <h5 className="my-0">
                                <strong>
                                    {t('search.term')}
                                </strong>
                            </h5>
                        </Form.Label>
                    </div>
                    <div className="col-8 text-center">
                        <Form.Select value={params.term} onChange={onChangeTerms}>
                            {terms.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                </Form.Group>

                <Form.Group controlId="hours" className="row mx-auto form-row">
                    <div className="col-4 text-end my-auto text-break">
                        <Form.Label className="col text-end my-auto">
                            <h5 className="my-0">
                                <strong>
                                    {t('search.hoursPerWeek')}
                                </strong>
                            </h5>
                        </Form.Label>
                    </div>
                    <div className="col-8">
                        <Form.Control
                            type="number"
                            value={params.hours}
                            onChange={onChangeHours}
                        />
                    </div>
                </Form.Group>

                <Form.Group controlId="prioritize" className="row mx-auto form-row">
                    <div className="col-4 text-end my-auto text-break">
                        <Form.Label className="my-0">
                            <h5 className="my-0">
                                <strong>
                                    {t('search.prioritizeUnlocks')}
                                </strong>
                            </h5>
                        </Form.Label>
                    </div>
                    <div className="col-8 d-flex align-items-start align-items-center">
                        <Form.Check
                            checked={params.prioritizeUnlocks}
                            className="color-secondary m-0"
                            onChange={onChangePrioritize}
                        />
                    </div>
                </Form.Group>

                <Form.Group controlId="reduceDays" className="row mx-auto form-row">
                    <div className="col-4 text-end my-auto text-break">
                        <Form.Label className="my-0">
                            <h5 className="my-0">
                                <strong>
                                    {t('search.reduceDays')}
                                </strong>
                            </h5>
                        </Form.Label>
                    </div>
                    <div className="col-8 d-flex align-items-start align-items-center">
                        <Form.Check
                            checked={params.reduceDays}
                            className="m-0"
                            onChange={onChangeReduceDays}
                        />
                    </div>
                </Form.Group>

                <Form.Group controlId="unavailableSlots" className="row mx-auto form-row">
                    <div className="col-4 text-end my-3 text-break">
                        <Form.Label className="my-0">
                            <h5 className="my-0">
                                <strong>
                                    {t('search.unavailableSlots')}
                                </strong>
                            </h5>
                        </Form.Label>
                    </div>
                    <div className="col-8 align-items-start align-items-center">
                        {params.unavailableTimeSlots.map((entry, index) => (
                            <Row
                                key={'timerow-' + index}
                                xs={1}
                                md={6}
                                className="list-row pb-2 pt-3 justify-content-center"
                            >
                                <Form.Select
                                    id={'day-' + index}
                                    className="w-auto mx-1"
                                    value={params.unavailableTimeSlots[index].day}
                                    onChange={onChangeDay}
                                >
                                    {DAYS.map((p) => (
                                        <option key={p} value={p}>
                                            {t('days.' + p)}
                                        </option>
                                    ))}
                                </Form.Select>
                                <input
                                    type="time"
                                    id={'start-' + index}
                                    className="w-auto timepicker"
                                    value={params.unavailableTimeSlots[index].startTime}
                                    onChange={onChangeStartTime}
                                />
                                <h5 className="my-auto w-auto">
                                    <strong>-</strong>
                                </h5>
                                <input
                                    type="time"
                                    id={'end-' + index}
                                    className="w-auto timepicker"
                                    value={params.unavailableTimeSlots[index].endTime}
                                    onChange={onChangeEndTime}
                                />
                                <i
                                    className="bi bi-trash-fill btn color-white w-auto my-auto mx-2"
                                    id={'trash-' + index}
                                    onClick={onClickTrashCan}
                                ></i>
                            </Row>
                        ))}
                        <div className="mx-auto align-items-center plus-button-container clickable">
                            <i
                                className="bi bi-plus-circle-fill btn btn-lg color-white"
                                onClick={onClickPlusSign}
                            ></i>
                        </div>
                    </div>
                </Form.Group>
                <div className="row">
                    <div className="col text-center">
                        <LinkContainer to={getPath('Newcomer')}>
                            <Button className="btn btn-secondary mt-3">Newcomer</Button>
                        </LinkContainer>
                    </div>
                    <div className="col text-center">
                        <LinkContainer to={getPath('Algebra')}>
                            <Button className="btn btn-secondary mt-3">Algebra + Intro Inf</Button>
                        </LinkContainer>
                    </div>
                    <div className="col text-center">
                        <LinkContainer to={getPath('1C')}>
                            <Button className="btn btn-secondary mt-3">1° Semester Done</Button>
                        </LinkContainer>
                    </div>
                    <div className="col text-center">
                        <LinkContainer to={getPath('2C')}>
                            <Button className="btn btn-secondary mt-3">2° Semester Done</Button>
                        </LinkContainer>
                    </div>
                </div>
            </Form>
        </React.Fragment>
    );
}

export default SearchForm;
