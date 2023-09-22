import React, {useState, useEffect, useCallback} from 'react';
import Alert from 'react-bootstrap/Alert';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import ApiService from '../../services/ApiService';
import { OK, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import { DAYS } from "../../services/SystemConstants";
import { useLocation } from 'react-router-dom';
import LinkButton from '../Common/LinkButton';
import ErrorMessage from '../Common/ErrorMessage';
import Roles from '../../resources/RoleConstants';

function SearchResults(props) {
    const {t} = useTranslation();
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [scheduleIndex, setScheduleIndex] = useState(0);
    const [tables, setTables] = useState();
    const [params, setParams] = useState();
    const [user] = useState(ApiService.getActiveUser())
    const search = useLocation().search
    const getTimeTable = (schedule, palette) => {
        var timeTable = {}
        DAYS.forEach((d) => timeTable[d] = Array.from({ length: 24 }))
        schedule.courseClasses.forEach((c) => {
            c.lectures.forEach((l) => {
                const startTime = l.startTime.split(':');
                const endTime = l.endTime.split(':');
                const startHour = startTime[1] >= '50' ? Number(startTime[0]) + 1 : Number(startTime[0]);
                const endHour = endTime[1] <= '10' ? Number(endTime[0]) : Number(endTime[0]) + 1;
                for (let i = startHour; i < endHour; i++)
                    timeTable[l.day][i] = {
                        lecture: l,
                        startHour: startHour,
                        duration: endHour - startHour,
                        courseClass: c,
                        color: palette[c.course.id],
                    };
            });
        });
        return timeTable;
    }

    const drawTable = useCallback((timeTable, earliest, latest, id) => {
        return (
            <table key={'t-' + id} className="table table-bordered text-center">
                <thead>
                    <tr className="bg-primary border-dark text-white">
                        <th className="text-uppercase bg-primary text-white"></th>
                        {DAYS.map((d) => {
                            return (
                                <th key={'t-' + id + '-d-' + d} className="text-uppercase bg-primary text-white">
                                    {t('days.' + d)}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 24 }, (v, k) => k).map((h) => {
                        if (h >= earliest && h < latest) {
                            var contents = {};
                            DAYS.forEach((d) => {
                                if (timeTable[d][h]) {
                                    const c = timeTable[d][h];
                                    if (timeTable[d][h].startHour === h)
                                        contents[d] = (
                                            <td
                                                className={'day-column align-middle bg-color-' + c.color}
                                                rowSpan={c.duration}
                                            >
                                                <div>
                                                    <div className="col">
                                                        <b> {c.courseClass.course.code} - {c.courseClass.course.name} </b>
                                                        <i>&nbsp;({c.courseClass.name})</i>
                                                    </div>
                                                    <div className="col"> {c.lecture.startTime}-{c.lecture.endTime} ( {c.lecture.building.code} ) </div>
                                                </div>
                                            </td>
                                        );
                                }
                                else
                                    contents[d] = <td className="day-column text-uppercase bg-black"></td>;
                            });
                            return (
                                <tr key={'id-' + id + 'h' + h} className="border-dark">
                                    <td className="text-uppercase bg-primary text-white">{h + ':00'}</td>
                                    {DAYS.map((d) => (
                                        <React.Fragment key={'id-' + id + 'd-' + d + 'h-' + h}>
                                            {contents[d]}
                                        </React.Fragment>
                                    ))}
                                </tr>
                            );
                        }
                        return <tr className="border-dark" key={'id-' + id + 'h' + h}></tr>;
                    })}
                </tbody>
            </table>
        );
    }, [t]);

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [navigate, user])

    useEffect(() => {
        const readParams = () => {
            const query = new URLSearchParams(search);
            const params = {
                programId: query.get('programId'),
                termId: query.get('termId'),
                hours: query.get('hours'),
                reduceDays: query.get('reduceDays'),
                prioritizeUnlocks: query.get('prioritizeUnlocks'),
                unavailableTimeSlots: query.getAll('unavailable'),
            };
            if(!params.programId || !params.termId || !params.hours)
                setParams(null);
            setParams(params);
        }

        const createColorPalette = (schedules) => {
            const courses = new Set()
            for(const s of schedules){
                for(const cc of s.courseClasses)
                    courses.add(cc.course.id)
            }
            const palette = {}
            let idx = 0
            for(const c of courses){
                palette[c] = idx%12
                idx++
            }
            courses.forEach((c, idx) => {})
            return palette
        }

        if(!params) readParams()
        else if(params === null) setLoading(false)
        else {
            ApiService.getSchedules(params).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError) {
                    setError(true);
                    setStatus(findError);
                }
                else {
                    var tables = []
                    const palette = createColorPalette(resp.data)
                    resp.data.forEach((s, idx) => {
                        const earliest = Number(resp.data[idx].stats.earliestLecture.split(':')[0])
                        const latest = Number(resp.data[idx].stats.latestLecture.split(':')[0])
                        tables.push(drawTable(getTimeTable(s, palette), earliest-1, latest+1, idx));
                    });
                    setSchedules(resp.data)
                    setScheduleIndex(0)
                    setTables(tables)
                }
                setLoading(false);
            })
        }
    }, [params, user, search, drawTable])

    const onClickLeftArrow = (e) => {
        setScheduleIndex(scheduleIndex-1)
    }

    const onClickRightArrow = (e) => {
        setScheduleIndex(scheduleIndex+1)
    }

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.STUDENT)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true) {
        return (
            <div className="p-5">
                <Alert variant="primary" className="text-center">
                    <Alert.Heading>{t("results.loading")}</Alert.Heading>
                    <p className="mx-4">{t("results.pleaseWait")}</p>
                    <Spinner animation="border" variant="primary" />
                </Alert>
            </div>
        )
    }
    if (error)
        return <ErrorMessage status={status}/>
    if (params == null)
        return <ErrorMessage message={"search.invalidParams"}/>
    if(schedules.length === 0 || schedules[0].courseClasses.length === 0)
        return (
            <React.Fragment>
                <HelmetProvider>
                    <Helmet><title>{t("results.results") +" - AutoScheduler"}</title></Helmet>
                </HelmetProvider>
                <div className="m-5 text-black">
                    <div className="d-flex justify-content-center align-items-center">
                        <Alert variant="primary" className="text-center">
                            <p>{t("noSchedulesFound")}</p>
                            <LinkButton variant="primary" textKey="goHome" href="/"/>
                        </Alert>
                    </div>
                </div>
            </React.Fragment>
        )
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t("results.results") +" - AutoScheduler"}</title></Helmet>
            </HelmetProvider>
            <div className="m-5 text-black ">
                <div className="text-center ">
                    <div className="d-inline-flex flex-wrap justify-content-center align-items-center">
                        {
                            scheduleIndex > 0? [
                                <i
                                      key="back-e"
                                      className="bi bi-arrow-left-circle-fill btn btn-lg arrow-button-big color-primary"
                                      onClick={onClickLeftArrow}
                                ></i>,
                              ]
                            : [<i key="back-d" className="bi bi-arrow-left-circle-fill btn btn-lg arrow-button-big disabled color-disabled"></i>]}
                        <div key={'schedule-' + scheduleIndex} className="mx-3 px-5 text-center">
                            <h1>
                                {t('results.scheduleNumber', { value: 1 + scheduleIndex })}
                            </h1>
                            <p>
                                {
                                    t('results.recap', {
                                        days: schedules[scheduleIndex].stats.totalDays,
                                        hours: schedules[scheduleIndex].stats.totalHours,
                                    })
                                }
                                <br />
                                {
                                    t('results.timeRange', {
                                        earliest: schedules[scheduleIndex].stats.earliestLecture,
                                        latest: schedules[scheduleIndex].stats.latestLecture,
                                    })
                                }
                            </p>
                        </div>
                        {scheduleIndex < schedules.length - 1 ? [
                                <i
                                    key="back-e"
                                    className="bi bi-arrow-right-circle-fill btn btn-lg arrow-button-big color-primary"
                                    onClick={onClickRightArrow}
                                ></i>,
                              ]
                            : [
                                <i
                                    key="back-d"
                                    className="bi bi-arrow-right-circle-fill btn btn-lg arrow-button-big disabled color-disabled"
                                ></i>,
                            ]}
                    </div>
                </div>
                {window.innerWidth > 1000 && (
                    <div className="d-flex my-3 justify-content-center align-items-center">
                        <div className="schedule-table">{tables[scheduleIndex]}</div>
                    </div>
                )}

                <div className="my-3 d-flex justify-content-center align-items-center">
                    <ul className="list-unstyled row container justify-content-center">
                        {schedules[scheduleIndex].courseClasses.map((c, cidx) => {
                            return (
                                <li key={'ci-' + cidx} className="list-item col border border-primary py-2">
                                    {c.course.code} - {c.course.name} ({c.name})
                                    <ul>
                                        {c.lectures.map((l, lidx) => {
                                            return (
                                                <li key={'li-' + lidx}>
                                                    <b> {t('days.' + l.day)}: </b>{' '}
                                                    {l.startTime}-{l.endTime} ({l.building.code})
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="text-center">
                    <LinkButton href={'/'} textKey="results.newSearch"/>
                </div>
            </div>
        </React.Fragment>
    );
}

export default SearchResults;
