import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Button, Spinner} from 'react-bootstrap';
import {Translation} from "react-i18next";
import {Link} from 'react-router-dom';
import LinkButton from './LinkButton'
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import withQuery from '../hoc/withQuery';

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

class SearchResults extends Component {
  state = {
    loading: true,
    error: false,
    status: null,
    schedules: []
  };

  componentDidMount() {
    let params = this.readParams();
    ApiService.getSchedules(params).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED) {
        findError = data.status;
      }
      if(findError) {
        this.setState({
          loading: false,
          error: true,
          status: findError,
        });
      }
      else {
        this.setState({
          schedules: data,
          loading: false,
        });
      }
    });
  }

  readParams(props) {
    if(!props)
      props = this.props;
    const params = {
      program: props.query.get("program"),
      term: props.query.get("term"),
      hours: props.query.get("hours"),
      reduceDays: props.query.get("reduceDays"),
      prioritizeUnlocks: props.query.get("prioritizeUnlocks"),
      unavailableTimeSlots: props.query.getAll("unavailable"),
      userAsking: props.query.get("userAsking"),
    }
    this.setState({params: params});
    return params;
  }

  render(){

    if (this.state.loading === true) {
      return  <div style={{position: 'absolute', left: '50%', top: '50%',transform: 'translate(-50%, -50%)'}}>
                <Spinner animation="border" variant="primary" />
              </div>
    }
    if(this.state.error) {
      return <h1>ERROR {this.state.error}</h1>
    }
    return (
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>Results - AutoScheduler</title></Helmet>
        </HelmetProvider>
        <div>
        {
          this.state.schedules.map((s, idx) => {
            return(
              <div key={"schedule-"+idx}>
                <h1><Translation>{t => t("results.scheduleNumber", {value:1+idx})}</Translation></h1>
                <p>
                  <Translation>{t => t("results.recap", {days:s.days, hours:s.hours})}</Translation><br/>
                  <Translation>{t => t("results.timeRange", {earliest:s.earliest, latest:s.latest})}</Translation>
                </p>
                <ul>
                {
                  s.courseClasses.map((c, cidx) => {
                    return( <li key={"ci-"+cidx}>
                              {c.course} - {c.courseName} ({c.courseClass})
                              <ul>{c.lectures.map((l, lidx) => {
                                return(
                                  <li key={"li-"+lidx}>
                                    <b><Translation>{t => t("days."+l.day)}</Translation>:</b> {l.startTime}-{l.endTime} ({l.building})
                                  </li>
                                );})}</ul>
                            </li>);
                  })
                }
                </ul>
              </div>
            );
          }
        )}
        </div>
      </React.Fragment>
    );
  }
}

export default withQuery(SearchResults);
