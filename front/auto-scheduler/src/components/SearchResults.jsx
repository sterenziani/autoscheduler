import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Button, Spinner} from 'react-bootstrap';
import {Translation} from "react-i18next";
import {Link} from 'react-router-dom';
import LinkButton from './LinkButton'
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import withQuery from '../hoc/withQuery';

class SearchResults extends Component {
  state = {
    loading: true,
    error: false,
    status: null,
    games: []
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
        console.log(data)
        this.setState({
          availableClasses: data,
          loading: false,
        });
      }
    });
  }

  readParams(props) {
    if(!props)
      props = this.props;
    const params = {
      program: props.query.get("hours"),
      period: props.query.get("program"),
      hours: props.query.get("hours"),
      reduceDays: props.query.get("reduceDays"),
      prioritizeUnlocks: props.query.get("prioritizeUnlocks"),
      unavailableTimeSlots: props.query.getAll("unavailable"),
      userAsking: 'Student'
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
          <ul>
            {this.state.games.map((g) => {
              return (
                <li key={g.id}>
                  {g.title} {g.firstName}
                </li>
              );
            })}
          </ul>
        </div>
      </React.Fragment>
    );
  }
}

export default withQuery(SearchResults);
