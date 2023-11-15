import React, {useState, useEffect} from 'react';
import { Button, Form, Spinner, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import ApiService from '../../services/ApiService';
import FormInputLabel from '../Common/FormInputLabel';
import FormAsyncSelect from '../Common/FormAsyncSelect';
import ErrorMessage from '../Common/ErrorMessage';
import { OK } from '../../resources/ApiConstants';
import { DAYS, INSTANT_DATE } from "../../resources/SystemConstants";


function SearchForm(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const student = props.student
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const [programError, setProgramError] = useState()
    const [timeError, setTimeError] = useState()

    const [terms, setTerms] = useState()
    const [params, setParams] = useState({
        programId: (student.program? student.program.id:undefined),
        termId: undefined, hours: 24,
        reduceDays: true, prioritizeUnlocks: true,
        unavailableTimeSlots: [JSON.parse(JSON.stringify(INSTANT_DATE))]
    });

    const onChangeHours = (e) => {
        const newValue = e.target.value? e.target.value : 0
        const paramsCopy = Object.assign({}, params);
        paramsCopy.hours = parseInt(newValue);
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
        setTimeError(false)
    }

    const onChangeEndTime = (e) => {
        const paramsCopy = Object.assign({}, params);
        const index = e.target.id.match(/\d/g)[0];
        paramsCopy.unavailableTimeSlots[index].endTime = e.target.value;
        setParams(paramsCopy)
        setTimeError(false)
    }

    const onClickTrashCan = (e) => {
        const paramsCopy = Object.assign({}, params);
        const index = e.target.id.match(/\d/g)[0];
        paramsCopy.unavailableTimeSlots.splice(index, 1);
        setParams(paramsCopy)
    }

    const onClickPlusSign = (e) => {
        const paramsCopy = Object.assign({}, params);
        paramsCopy.unavailableTimeSlots.push(JSON.parse(JSON.stringify(INSTANT_DATE)));
        setParams(paramsCopy)
    }

    const getPath = () => {
        let path = 'results';
        path += '?programId=' + params.programId;
        path += '&termId=' + (params.termId ? params.termId : terms[0]);
        path += '&hours=' + params.hours;
        path += '&reduceDays=' + params.reduceDays;
        path += '&prioritizeUnlocks=' + params.prioritizeUnlocks;
        if (params.unavailableTimeSlots) {
            params.unavailableTimeSlots.forEach((slot) => {
                if (slot.startTime < slot.endTime)
                    path += '&unavailable=' + DAYS.indexOf(slot.day) + '-' + slot.startTime + '-' + slot.endTime;
            });
        }
        return path;
    }

    const onButtonSubmit = (studentName) => {
        let noErrors = true;
        if(params){
            for(const tr of params.unavailableTimeSlots){
                if(tr.startTime > tr.endTime){
                    noErrors = false
                    setTimeError(true)
                }
            }
            if(!params.programId){
                setProgramError(true)
                noErrors = false
            }
        } else {
            noErrors = false
        }
        if(noErrors)
            navigate(getPath())
    }

    useEffect( () => {
        if(!student)
            navigate("/register")
        // Load terms once
        if(!terms && loading)
        {
            ApiService.getTerms(1, true).then((resp) => {
                if (resp && resp.status && resp.status !== OK)
                    setError(resp.status)
                else {
                    if(params && !params.termId){
                        const paramsCopy = Object.assign({}, params)
                        if(resp.data.length > 0)
                            paramsCopy.termId = resp.data[0].id
                        setParams(paramsCopy)
                    }
                    setTerms(resp.data)
                }
                setLoading(false)
            })
        }
    }, [navigate, params, student, loading, terms])

    const loadProgramOptions = (inputValue, callback) => {
        setTimeout(() => {
            ApiService.getPrograms(inputValue).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setError(resp.status)
                    callback([])
                } else {
                    callback(resp.data)
                }
            })
        })
    }

    const onChangePrograms = (programId) => {
        const paramsCopy = Object.assign({}, params)
        paramsCopy.programId = programId
        setParams(paramsCopy)
        setProgramError(false)
    }

    const onChangeTerms = (e) => {
        const paramsCopy = Object.assign({}, params)
        paramsCopy.termId = e.target.value
        setParams(paramsCopy)
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
    if(terms.length === 0)
        return <React.Fragment><div className="bg-primary rounded-bottom mx-5 py-4"><p>{t('search.noTermsFromUniversity')}</p></div></React.Fragment>
    return (
        <React.Fragment>
            <Form className="p-3 mx-auto text-center color-white">
                <div className='row mx-auto form-row text-center'>
                    <FormInputLabel label="search.program" columnWidth={4}/>
                    <div className="col-md-8 text-center">
                        <FormAsyncSelect
                            className="text-black text-start"
                            placeholder={t('search.program')}
                            cacheOptions
                            defaultOptions
                            defaultValue = {student.program? {value:student.program.id, internalId: student.program.internalId, name: student.program.name}:undefined}
                            noOptionsMessage={() => t('selectNoResults')}
                            getOptionLabel={e => e.internalId+' - '+e.name}
                            getOptionValue={e => e.id}
                            loadOptions={loadProgramOptions}
                            onChange={opt => onChangePrograms(opt.id)}
                        />
                        { programError && <p key="program-error" className="form-error text-start my-0">{t('search.programError')}</p>}
                    </div>
                </div>

                <Form.Group controlId="term" className="row mx-auto form-row">
                    <FormInputLabel label="search.term" columnWidth={4}/>
                    <div className="col-md-8 text-center">
                        <Form.Select value={params.term} onChange={onChangeTerms}>
                            {terms.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                </Form.Group>

                <Form.Group controlId="hours" className="row mx-auto form-row">
                    <FormInputLabel label="search.hoursPerWeek" columnWidth={4}/>
                    <div className="col-md-8">
                        <Form.Control
                            type="number" min="0"
                            value={params.hours}
                            onChange={onChangeHours}
                        />
                    </div>
                </Form.Group>

                <Form.Group controlId="prioritize" className="my-4 row mx-auto form-row">
                    <FormInputLabel
                        label="search.prioritizeUnlocks" columnWidth={4}
                        tooltipIconColor="primary" tooltipBgColor="white"
                        tooltipMessage="search.prioritizeUnlocksTooltip"
                    />
                    <div className="col-md-8 d-flex align-items-start align-items-center">
                        <Form.Check
                            checked={params.prioritizeUnlocks}
                            className="color-secondary m-0"
                            onChange={onChangePrioritize}
                        />
                    </div>
                </Form.Group>

                <Form.Group controlId="reduceDays" className="pt-2 row mx-auto form-row">
                    <FormInputLabel
                        label="search.reduceDays" columnWidth={4}
                        tooltipIconColor="primary" tooltipBgColor="white"
                        tooltipMessage="search.reduceDaysTooltip"
                    />
                    <div className="col-md-8 d-flex align-items-start align-items-center">
                        <Form.Check
                            checked={params.reduceDays}
                            className="m-0"
                            onChange={onChangeReduceDays}
                        />
                    </div>
                </Form.Group>

                <div className='row mx-auto form-row'>
                    <FormInputLabel label="search.unavailableSlots" columnWidth={4}/>
                    <div className="col-md-8 align-items-start">
                        { timeError && <p key="program-error" className="form-error text-center my-0">{t('forms.errors.timeRange')}</p>}
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
                </div>

                <div className="row">
                    <div className="col text-center">
                        <Button className="btn btn-secondary mt-3" onClick={() => onButtonSubmit()}>{t("search.submit")}</Button>
                    </div>
                </div>
            </Form>
        </React.Fragment>
    );
}

export default SearchForm;
