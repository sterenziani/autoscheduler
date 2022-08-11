import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Tabs, Tab} from 'react-bootstrap';
import {Translation} from "react-i18next";
import HomePageUniversity from '../components/HomePageUniversity'
import HomePageStudent from '../components/HomePageStudent'
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';

class HomePage extends Component {
  state = {
    loading: true,
    error: false,
    user: null,
  }

  componentDidMount() {
    ApiService.getActiveUser().then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED)
        findError = data.status;
      if(findError)
        this.setState({ loading: false, error: true, status: findError });
      else
        this.setState({ user: data });
    });
  }

  render(){
    return(
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>AutoScheduler</title></Helmet>
        </HelmetProvider>
        {
          (this.state.user && this.state.user.type=="student" && <HomePageStudent/>)
        }
        {
          (this.state.user && this.state.user.type=="university" && <HomePageUniversity user={this.state.user}/>)
        }
      </React.Fragment>
    );
  }
}

export default HomePage;
