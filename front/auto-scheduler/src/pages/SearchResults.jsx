import React, {useState, useEffect} from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import { useLocation } from 'react-router-dom';
import LinkButton from '../components/LinkButton';

const DAYS = ['SUN', 'M', 'T', 'W', 'TH', 'F', 'SAT'];

function SearchResults(props) {
    const {t} = useTranslation();
    const query = new URLSearchParams(useLocation().search);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [scheduleIndex, setScheduleIndex] = useState(0);
    const [tables, setTables] = useState();

    const getTimeTable = (schedule) => {
        var timeTable = {};
        var classColors = {};
        var colorIndex = 0;
        DAYS.forEach((d) => {
            timeTable[d] = Array.from({ length: 24 });
        });
        schedule.courseClasses.forEach((c) => {
            classColors[c.course] = colorIndex % 8;
            colorIndex++;
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
                        color: classColors[c.course],
                    };
            });
        });
        return timeTable;
    }

    const drawTable = (timeTable, earliest, latest, id) => {
        return (
            <table key={'t-' + id} className="table table-bordered text-center">
                <thead>
                    <tr className="bg-primary border-dark text-white">
                        <th className="text-uppercase"></th>
                        {DAYS.map((d) => {
                            return (
                                <th key={'t-' + id + '-d-' + d} className="text-uppercase">
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
                                                        <b> {c.courseClass.course} - {c.courseClass.courseName} </b>
                                                        <i>&nbsp;({c.courseClass.courseClass})</i>
                                                    </div>
                                                    <div className="col"> {c.lecture.startTime}-{c.lecture.endTime} </div>
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
    }

    const readParams = () => {
        const params = {
            program: query.get('program'),
            term: query.get('term'),
            hours: query.get('hours'),
            reduceDays: query.get('reduceDays'),
            prioritizeUnlocks: query.get('prioritizeUnlocks'),
            unavailableTimeSlots: query.getAll('unavailable'),
            userAsking: query.get('userAsking'),
        };
        return params;
    }

    const params = readParams();

    useEffect( () => {
        ApiService.getSchedules(params).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError) {
                setError(true);
                setStatus(findError);
            }
            else {
                var tables = [];
                data.forEach((s, idx) => {
                    const earliest = Number(data[idx].earliest.split(':')[0])
                    const latest = Number(data[idx].latest.split(':')[0])
                    tables.push(drawTable(getTimeTable(s), earliest-1, latest+1, idx));
                });
                setSchedules(data)
                setScheduleIndex(0)
                setTables(tables)
            }
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onClickLeftArrow = (e) => {
        setScheduleIndex(scheduleIndex-1)
    }

    const onClickRightArrow = (e) => {
        setScheduleIndex(scheduleIndex+1)
    }

    if (loading === true) {
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t("results.results") +" - AutoScheduler"}</title></Helmet>
            </HelmetProvider>
            <div className="m-5 text-black">
                <div className="d-flex justify-content-center align-items-center">
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
                                    days: schedules[scheduleIndex].days,
                                    hours: schedules[scheduleIndex].hours,
                                })
                            }
                            <br />
                            {
                                t('results.timeRange', {
                                    earliest: schedules[scheduleIndex].earliest,
                                    latest: schedules[scheduleIndex].latest,
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
                {window.innerWidth > 1000 && (
                    <div className="container my-3 justify-content-center align-items-center">
                        <div className="table-responsive">{tables[scheduleIndex]}</div>
                    </div>
                )}

                <div className="my-3 d-flex justify-content-center align-items-center">
                    <ul className="list-unstyled row container justify-content-center">
                        {schedules[scheduleIndex].courseClasses.map((c, cidx) => {
                            return (
                                <li key={'ci-' + cidx} className="list-item col border border-primary py-2">
                                    {c.course} - {c.courseName} ({c.courseClass})
                                    <ul>
                                        {c.lectures.map((l, lidx) => {
                                            return (
                                                <li key={'li-' + lidx}>
                                                    <b> {t('days.' + l.day)}: </b>{' '}
                                                    {l.startTime}-{l.endTime} ({l.building})
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
